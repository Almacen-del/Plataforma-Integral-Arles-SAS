"""Compare source OOXML semantics independently of the JavaScript importer."""
import argparse, json, zipfile, hashlib
from pathlib import Path
from lxml import etree as E

ROOT = Path(__file__).resolve().parents[1] / 'output/word-corpus-50'
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS = {'w': W}
def attr(n, key, default=None):
    return n.get('{'+W+'}'+key, default) if n is not None else default
def read(z, name):
    return E.fromstring(z.read(name)) if name in z.namelist() else E.Element('empty')
def enabled(n):
    return n is not None and attr(n, 'val') not in ['0','false','off']
def snapshot(path):
    with zipfile.ZipFile(path) as z:
        doc=read(z,'word/document.xml'); settings=read(z,'word/settings.xml')
        sections=[]
        for s in doc.findall('.//w:sectPr',NS):
            mar=s.find('w:pgMar',NS); size=s.find('w:pgSz',NS)
            sections.append({**{k:int(attr(mar,k,0)) for k in ['top','bottom','left','right','gutter','header','footer']},
                'width':int(attr(size,'w',0)), 'height':int(attr(size,'h',0))})
        tables=[]
        for table in doc.findall('.//w:tbl',NS):
            rows=[]
            for row in table.findall('w:tr',NS):
                rows.append([{'span':int(attr(c.find('w:tcPr/w:gridSpan',NS),'val',1)),
                    'merge':attr(c.find('w:tcPr/w:vMerge',NS),'val','continue') if c.find('w:tcPr/w:vMerge',NS) is not None else None,
                    'text':''.join(c.itertext())} for c in row.findall('w:tc',NS)])
            tables.append(rows)
        # Canonical namespace spelling can differ; compare properties and metadata instead.
        changes=[{'author':attr(n,'author'), 'date':attr(n,'date'), 'properties':[(E.QName(c).localname,sorted((E.QName(k).localname,v) for k,v in c.attrib.items())) for c in n.findall('w:pPr/*',NS)]} for n in doc.findall('.//w:pPrChange',NS)]
        extras={n:hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist() if n=='customXml/adjunto.xml'}
        return {'sections':sections,'mirror':enabled(settings.find('w:mirrorMargins',NS)), 'tables':tables,'paragraphRevisions':changes,'attachments':extras}

def main():
    p=argparse.ArgumentParser();p.add_argument('--run',required=True);p.add_argument('--ids');args=p.parse_args()
    folder=ROOT/'pruebas'/args.run; results=[]
    for m in json.loads((ROOT/'manifest.json').read_text(encoding='utf8')):
        if args.ids and m['id'] not in map(int,args.ids.split(',')):continue
        original=snapshot(ROOT/'originales'/m['filename']);row={'id':m['id'],'checks':[],'failures':[]}
        for mode in ['conservado','reconstruido','ui']:
            path=folder/f'{m["id"]:02d}-{mode}.docx'
            if not path.exists(): row['failures'].append(mode+': archivo ausente');continue
            actual=snapshot(path)
            def check(label,ok):
                row['checks'].append({'export':mode,'check':label,'pass':ok})
                if not ok:row['failures'].append(mode+': '+label)
            check('márgenes reflejados',original['mirror']==actual['mirror'])
            check('geometría de secciones',len(original['sections'])==len(actual['sections']) and all(all(abs(s[k]-t[k])<=2 for k in s) for s,t in zip(original['sections'],actual['sections'])))
            check('revisiones de párrafo',original['paragraphRevisions']==actual['paragraphRevisions'])
            check('adjunto XML intacto',all(actual['attachments'].get(k)==v for k,v in original['attachments'].items()))
            # Ignore cell text here: browser/PDF audit checks all paragraphs and intended edits.
            shape=lambda ts:[[[{k:c[k] for k in ['span','merge']} for c in row] for row in t] for t in ts]
            check('filas y combinaciones de tablas',shape(original['tables'])==shape(actual['tables']))
        results.append(row)
    (folder/'auditoria-semantica.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'documents':len(results),'checks':sum(len(r['checks']) for r in results),'failures':[{ 'id':r['id'],'errors':r['failures']} for r in results if r['failures']]},ensure_ascii=False))
    if any(r['failures'] for r in results):raise SystemExit(1)
if __name__=='__main__':main()
