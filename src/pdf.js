// Stamps a customer's details and electronic signature onto the agreement template.
// The template and field positions come from tools/build_agreement.py (assets/).

import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const INK = rgb(0x1d / 255, 0x20 / 255, 0x30 / 255);
const NAVY = rgb(0x06 / 255, 0x0a / 255, 0x2f / 255);
const MUTED = rgb(0x5d / 255, 0x62 / 255, 0x73 / 255);

/**
 * @param {object} a
 * @param {ArrayBuffer|Uint8Array} a.template   assets/agreement-template.pdf
 * @param {object} a.meta                      assets/agreement.json
 * @param {{regular, signature}} a.fonts  font bytes
 * @param {object} a.fields   field name -> text (customer details, signatory names, dates)
 * @param {string} a.customerSignature  typed name, drawn in the signature font
 * @param {string} a.techsortedSignature
 * @param {string} a.record   one-line signing record printed above the footer
 * @param {string} a.id       agreement reference, stored in the PDF metadata
 */
export async function stampAgreement(a) {
  const doc = await PDFDocument.load(a.template);
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(a.fonts.regular, { subset: true });
  const signature = await doc.embedFont(a.fonts.signature, { subset: true });
  const page = doc.getPage(0);
  const F = a.meta.fields;

  const put = (name, text, { font = regular, size = 8.6, color = INK, lift = 2.6, min = 5.5 } = {}) => {
    const r = F[name];
    if (!r || !text) return;
    const [x0, y0, x1] = r;
    const width = x1 - x0 - 2;
    let s = size;
    while (s > min && font.widthOfTextAtSize(text, s) > width) s -= 0.25;
    let t = text;
    while (t.length > 1 && font.widthOfTextAtSize(t, s) > width) t = t.slice(0, -2) + "…";
    page.drawText(t, { x: x0 + 1, y: y0 + lift, size: s, font, color });
  };

  for (const [name, text] of Object.entries(a.fields)) put(name, text);
  put("customer_signature", a.customerSignature, { font: signature, size: 17, color: NAVY, lift: 2, min: 9 });
  put("techsorted_signature", a.techsortedSignature, { font: signature, size: 17, color: NAVY, lift: 2, min: 9 });
  put("signing_record", a.record, { size: 6.4, color: MUTED, lift: 1.4, min: 4.5 });

  doc.setTitle(`Tap Sign Service Agreement – ${a.fields.business_name || ""} (${a.id})`);
  doc.setAuthor("tap by techsorted");
  doc.setSubject(`Agreement ${a.id}, version ${a.meta.version}`);
  doc.setKeywords([a.id, `v${a.meta.version}`]);
  doc.setProducer("tap-join");
  doc.setCreator("tap-join");
  return doc.save();
}
