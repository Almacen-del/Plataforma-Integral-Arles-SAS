"""Compare original Word references with browser PDFs; never approve by page count alone."""
import json
from pathlib import Path
import numpy as np
import pypdfium2 as pdf
from PIL import Image, ImageChops, ImageDraw

root=Path('output/word-corpus-50')
refs=json.loads((root/'referencia-microsoft-word/resultados.json').read_text(encoding='utf-8-sig'))
cases=[(f'{r["id"]:02}',root/f'referencia-microsoft-word/{r["id"]:02}.pdf',root/f'comparacion-originales/{r["id"]:02}/motor.pdf') for r in refs if not r.get('error')]
cases += [(name,Path(f'output/{name}/referencia-word.pdf'),Path(f'output/{name}/motor.pdf')) for name in ['word-ipevr','word-anexo43']]
out=root/'comparacion-visual-word';out.mkdir(parents=True,exist_ok=True)
results=[]
for name,reference,engine in cases:
    a,b=pdf.PdfDocument(str(reference)),pdf.PdfDocument(str(engine))
    folder=out/name;folder.mkdir(exist_ok=True)
    result={'case':name,'referencePages':len(a),'enginePages':len(b),'pages':[],'approvedIdentical':False}
    thumbnails=[]
    for index in range(max(len(a),len(b))):
        images=[doc[index].render(scale=1).to_pil().convert('RGB') if index<len(doc) else None for doc in [a,b]]
        width=max(im.width for im in images if im);height=max(im.height for im in images if im)
        padded=[]
        for im in images:
            canvas=Image.new('RGB',(width,height),'white')
            if im:canvas.paste(im,(0,0))
            padded.append(canvas)
        delta=np.max(np.abs(np.asarray(padded[0],dtype=np.int16)-np.asarray(padded[1],dtype=np.int16)),axis=2)
        changed=float((delta>32).mean()*100)
        result['pages'].append({'page':index+1,'missingPage':any(im is None for im in images),'differentPixelsPercent':round(changed,4)})
        pair=Image.new('RGB',(width*2,height+24),'#eeeeee');pair.paste(padded[0],(0,24));pair.paste(padded[1],(width,24))
        draw=ImageDraw.Draw(pair);draw.text((8,6),f'Word original - {index+1}',fill='black');draw.text((width+8,6),f'Motor - {index+1}',fill='black')
        pair.save(folder/f'{index+1:03}.png')
        pair.thumbnail((600,440));thumbnails.append(pair)
    result['differentPixelsMeanPercent']=round(sum(p['differentPixelsPercent'] for p in result['pages'])/len(result['pages']),4)
    # Pixel changes include font rasterization; a zero/nonzero score is not a semantic verdict.
    result['assessment']='requires visual review; raster differences include antialiasing'
    contact=Image.new('RGB',(600,440*len(thumbnails)),'white')
    for i,im in enumerate(thumbnails):contact.paste(im,(0,i*440))
    contact.save(folder/'contact.png');results.append(result)
    a.close();b.close()
    print(name,result['referencePages'],result['enginePages'],result['differentPixelsMeanPercent'])
(out/'resultados.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
