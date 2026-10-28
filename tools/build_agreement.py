#!/usr/bin/env python3
"""Builds the agreement PDFs from agreement/agreement.html + agreement/terms.html.

Run after changing the terms (and bump agreement/version.txt first):
    pip install weasyprint pypdf
    python3 tools/build_agreement.py

Writes:
  assets/agreement-blank.pdf     fillable PDF (customers can review it; also works for signing by hand)
  assets/agreement-template.pdf  same layout with no form fields: the Worker stamps the details onto it
  assets/agreement.json          version + where each field sits on the page (PDF points)
Commit all three. The Worker serves and stamps these, so a merge to main ships the new version.
"""
import json, pathlib
import weasyprint
from pypdf import PdfReader

root = pathlib.Path(__file__).resolve().parent.parent
agr = root / "agreement"
out = root / "assets"
version = (agr / "version.txt").read_text().strip()
html = (agr / "agreement.html").read_text().replace("<!--TERMS-->", (agr / "terms.html").read_text()).replace("{{VERSION}}", version)

def render(path, forms):
    weasyprint.HTML(string=html, base_url=str(agr) + "/").write_pdf(str(path), pdf_forms=forms)

render(out / "agreement-blank.pdf", True)
render(out / "agreement-template.pdf", False)

reader = PdfReader(str(out / "agreement-blank.pdf"))
if len(reader.pages) != 1:
    raise SystemExit(f"Agreement must fit on one page, got {len(reader.pages)}")
page = reader.pages[0]
fields = {}
for annot in page.get("/Annots") or []:
    a = annot.get_object()
    name = a.get("/T")
    if name:
        x0, y0, x1, y1 = (float(v) for v in a["/Rect"])
        fields[str(name)] = [round(min(x0, x1), 2), round(min(y0, y1), 2), round(max(x0, x1), 2), round(max(y0, y1), 2)]
meta = {"version": version, "pageWidth": float(page.mediabox.width), "pageHeight": float(page.mediabox.height), "fields": fields}
(out / "agreement.json").write_text(json.dumps(meta, indent=2) + "\n")
print(f"Agreement v{version}: {len(fields)} fields -> assets/")
