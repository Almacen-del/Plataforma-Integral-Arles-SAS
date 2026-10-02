"""Read-only acceptance check: every DOCX body paragraph must appear in the PDF.
Usage: python tests/word-pdf-fidelity.py source.docx output.pdf
Requires pypdf. Run after word-real-format.browser.cjs for the local manual.
"""
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from pypdf import PdfReader

ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

def normalized(value):
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", value)).casefold()

with zipfile.ZipFile(sys.argv[1]) as archive:
    root = ET.fromstring(archive.read("word/document.xml"))
pdf = PdfReader(sys.argv[2])
text = normalized("".join(page.extract_text() for page in pdf.pages))
paragraphs = ["".join(node.text or "" for node in p.findall(".//w:t", ns))
              for p in root.findall(".//w:p", ns)]
missing = [p for p in paragraphs if normalized(p) and normalized(p) not in text]
assert not missing, f"{len(missing)} paragraphs missing from PDF: {missing[:3]}"
assert all(page.extract_text().strip() for page in pdf.pages), "Unexpected empty page"
print(f"PASS {len(pdf.pages)} PDF pages, {len(paragraphs)} source paragraphs checked, no missing text")
