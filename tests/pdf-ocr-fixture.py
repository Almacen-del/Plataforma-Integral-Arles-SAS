"""Isolated OCR fixture: raster scan, native-text page, rotated/cropped raster scan."""
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter
root=Path('tmp/pdfs');root.mkdir(parents=True,exist_ok=True)
font_path='C:/Windows/Fonts/arial.ttf'
def scan(title):
    image=Image.new('RGB',(1190,1684),'white');draw=ImageDraw.Draw(image)
    lines=[('ARLES SAS',48),(title,38),('Factura numero 12345',32),('Fecha: 01/10/2026',32),('Producto: Fertilizante',32),('Cantidad: 25 unidades',32),('Valor total: $ 1.250.000',32),('Documento escaneado de prueba.',28)]
    y=110
    for text,size in lines:
        draw.text((95,y),text,font=ImageFont.truetype(font_path,size),fill='#123d2d');y+=100
    return image
stream=BytesIO();doc=canvas.Canvas(stream,pagesize=(595,842))
doc.drawImage(ImageReader(scan('LECTURA OCR DE PRUEBA')),0,0,width=595,height=842);doc.showPage()
doc.setFont('Helvetica',20);doc.drawString(55,760,'TEXTO NATIVO - CONSERVAR SIN OCR');doc.showPage()
doc.setPageSize((615,850));doc.drawImage(ImageReader(scan('CONTROL DE ROTACION 6789')),20,30,width=575,height=770);doc.showPage();doc.save()
writer=PdfWriter();writer.append(PdfReader(stream));writer.pages[2].cropbox.lower_left=(20,30);writer.pages[2].cropbox.upper_right=(595,800);writer.pages[2].rotate(90)
with (root/'ocr-scanned.pdf').open('wb') as out:writer.write(out)
check=PdfReader(root/'ocr-scanned.pdf');assert check.pages[0].extract_text()=='';assert 'TEXTO NATIVO' in check.pages[1].extract_text();assert check.pages[2].extract_text()==''
print('OCR fixture: 3 pages; two raster scans and one native-text page, including rotated CropBox.')
