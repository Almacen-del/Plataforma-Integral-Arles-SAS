"""Reuse visual review only for identical full-page PNGs; flag every changed page."""
import argparse
import hashlib
import json
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--run', required=True)
p.add_argument('--baseline', required=True)
a = p.parse_args()
base = Path(__file__).resolve().parents[1] / 'output/word-corpus-50/pruebas'
prior = json.loads((base / a.baseline / 'revision-visual.json').read_text(encoding='utf-8-sig'))
reviewed = {r['sha256'] for r in prior if r.get('reviewed')}
rows = []
for image in sorted((base / a.run / 'paginas').glob('*/*.png')):
    digest = hashlib.sha256(image.read_bytes()).hexdigest()
    same = digest in reviewed
    rows.append(dict(file=image.relative_to(base / a.run / 'paginas').as_posix(),
                     case=int(image.parent.name), page=int(image.stem.split('-')[-1]),
                     sha256=digest, reviewed=same,
                     method=f'PNG completo coincide en SHA-256 con {a.baseline}' if same else 'Pendiente de inspeccion visual'))
(base / a.run / 'revision-visual.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(dict(pages=len(rows), identical=sum(r['reviewed'] for r in rows),
                      pending=[r['file'] for r in rows if not r['reviewed']]), ensure_ascii=False))
