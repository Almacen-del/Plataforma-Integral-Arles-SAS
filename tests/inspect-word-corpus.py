"""Independent package and PDF text audit plus PNGs for visual review."""
from pathlib import Path
import json, hashlib, re, zipfile, argparse, unicodedata
from lxml import etree as E
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image
from io import BytesIO
ROOT=Path(__file__).resolve().parents[1]/'output'/'word-corpus-50'
def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s))

def body_text_without_source_regions(texts, source):
    """Exclude only exact source region paragraphs, with resolved page fields.

    PDF extraction places running regions between fragments of a body paragraph
    split across pages. Never drop arbitrary intervening text to make it match.
    """
    ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    with zipfile.ZipFile(source) as z:
        regions=[z.read(n) for n in z.namelist() if re.fullmatch(r'word/(?:header|footer)\d+\.xml',n)]
    body=[];removed=[]
    for page_number,text in enumerate(texts,1):
        current=norm(text)
        for xml in regions:
            region=E.fromstring(xml)
            for field in region.findall('.//w:fldSimple',ns):
                instruction=field.get('{'+ns['w']+'}instr','').strip()
                value={'PAGE':page_number,'NUMPAGES':len(texts)}.get(instruction)
                if value is not None:
                    for child in list(field):field.remove(child)
                    E.SubElement(field,'{'+ns['w']+'}t').text=str(value)
            for paragraph in region.findall('.//w:p',ns):
                literal=norm(''.join(paragraph.itertext()))
                if literal and literal in current:
                    current=current.replace(literal,'',1)
                    removed.append({'page':page_number,'text':literal})
        body.append(current)
    return ''.join(body),removed
def main():
    p=argparse.ArgumentParser();p.add_argument('--run',default='baseline');p.add_argument('--render',action='store_true');args=p.parse_args()
    manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'));folder=ROOT/'pruebas'/args.run;report=[]
    results={r['id']:r for r in json.loads((folder/'resultados.json').read_text(encoding='utf-8'))} if (folder/'resultados.json').exists() else {}
    for m in manifest:
        source=ROOT/'originales'/m['filename'];row={'id':m['id'],'originalIntact':hashlib.sha256(source.read_bytes()).hexdigest()==m['sha256'],'packages':[]}
        for path in [source,*sorted(folder.glob(f'{m["id"]:02d}-*.docx'))]:
            errors=[]
            with zipfile.ZipFile(path) as z:
                if z.testzip():errors.append('CRC incorrecto')
                names=z.namelist()
                for name in names:
                    if name.endswith(('.xml','.rels')):
                        try:
                            parsed=E.fromstring(z.read(name))
                            if parsed.xpath('//*[local-name()="undefined"]'):errors.append(f'{name}: elemento OOXML undefined')
                        except E.XMLSyntaxError as ex:errors.append(f'{name}: {ex}')
                    if name.endswith('.rels'):
                        rels=E.fromstring(z.read(name));base=Path(name).parent.parent if '/_rels/' in name else Path('.')
                        for rel in rels:
                            if rel.get('TargetMode')=='External':continue
                            import posixpath
                            target=posixpath.normpath(str(base/rel.get('Target','')).replace('\\','/')).lstrip('/')
                            if target not in names:errors.append('Relación rota '+target)
            row['packages'].append({'file':path.name,'errors':errors})
        ui=folder/f'{m["id"]:02d}-ui.docx'
        if ui.exists():
            def image_pixels(path):
                hashes=[]
                with zipfile.ZipFile(path) as z:
                    for name in z.namelist():
                        if not name.startswith('word/media/') or name.endswith('/'):continue
                        with Image.open(BytesIO(z.read(name))) as im:
                            rgba=im.convert('RGBA');hashes.append(hashlib.sha256(str(rgba.size).encode()+rgba.tobytes()).hexdigest())
                return hashes
            before=image_pixels(source);after=image_pixels(ui)
            row['images']={'sourceImages':len(before),'exportedImages':len(after),'missingPixelHashes':[h for h in before if h not in after]}
            if m['id'] in [26,27]:
                with zipfile.ZipFile(ui) as z:
                    x=E.fromstring(z.read('word/document.xml'));s=x.find('.//w:sectPr',{'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'})
                    ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'}
                    attr=lambda n,k:float(n.get('{'+ns['w']+'}'+k))
                    content=attr(s.find('w:pgSz',ns),'w')-attr(s.find('w:pgMar',ns),'left')-attr(s.find('w:pgMar',ns),'right');cols=s.find('w:cols',ns)
                    widths=cols.findall('w:col',ns);column=min(attr(c,'w') for c in widths) if widths else (content-(attr(cols,'num')-1)*attr(cols,'space'))/attr(cols,'num')
                    actual=float(x.find('.//wp:extent',ns).get('cx'))/635
                    row['images']['columnWidthTwips']=column;row['images']['exportedWidthTwips']=actual
                    row['images']['fitsColumn']=abs(actual-.75*column)<20
        pdf=folder/f'{m["id"]:02d}.pdf'
        if pdf.exists():
            reader=PdfReader(pdf);texts=[page.extract_text() or '' for page in reader.pages]
            actual,source_regions=body_text_without_source_regions(texts,source)
            expected=[]
            for text in m['paragraphs']:
                edited=text.replace('lista','preparada') if text.startswith('Nota editorial del caso') else text
                for change in results.get(m['id'],{}).get('textEdits',[]):edited=edited.replace(change['before'],change['after'])
                expected.append(edited)
            missing=[t for t in expected if norm(t) not in actual]
            aliases=[t for t in missing if '\u064a' in t and norm(t).replace('\u06cc','\u064a') in actual.replace('\u06cc','\u064a')]
            missing=[t for t in missing if t not in aliases]
            # Pending deletions have deliberately been excluded by the PDF final-view renderer.
            row['pdf']={'pages':len(texts),'missingParagraphs':missing,'fontUnicodeAliases':aliases,'excludedSourceRegions':source_regions,'pageSizes':[[float(p.mediabox.width),float(p.mediabox.height)] for p in reader.pages]}
            if args.render:
                doc=pdfium.PdfDocument(pdf);target=folder/'paginas'/f'{m["id"]:02d}';target.mkdir(parents=True,exist_ok=True)
                for j in range(len(doc)):
                    page=doc[j];bitmap=page.render(scale=96/72);im=bitmap.to_pil();im.save(target/f'page-{j+1:02d}.png');bitmap.close();page.close()
                doc.close()
        report.append(row)
    (folder/'auditoria-independiente.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'documents':len(report),'damagedPackages':sum(any(p['errors'] for p in r['packages']) for r in report),'pdfs':sum('pdf' in r for r in report),'pages':sum(r.get('pdf',{}).get('pages',0) for r in report),'pdfUnicodeAliasWarnings':[(r['id'],len(r['pdf']['fontUnicodeAliases'])) for r in report if r.get('pdf',{}).get('fontUnicodeAliases')],'missingText':[(r['id'],len(r['pdf']['missingParagraphs'])) for r in report if r.get('pdf',{}).get('missingParagraphs')]},ensure_ascii=False))
    if any(not r['originalIntact'] or any(p['errors'] for p in r['packages']) or r.get('pdf',{}).get('missingParagraphs') or r.get('images',{}).get('missingPixelHashes') or r.get('images',{}).get('fitsColumn') is False for r in report):raise SystemExit(1)
if __name__=='__main__':main()
