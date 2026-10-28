// The two emails customers get: the sign-up link, and their signed copy.
// Plain, personal and table-based so they render the same in Gmail, Outlook and Apple Mail.
// No images (they're often blocked and look like marketing), one button, a real text version.

import { escapeHtml as e } from "./validate.js";

const FOOT =
  "tap by techsorted · Matangi, Hamilton 3284 · +64 276525216";

function layout({ preheader, body }) {
  return `<!doctype html>
<html lang="en-NZ"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f3f5f9">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all">${e(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e6ee;border-radius:12px">
<tr><td style="padding:22px 28px 0;font-family:Arial,Helvetica,sans-serif">
<span style="font-size:20px;font-weight:bold;color:#060a2f;letter-spacing:.5px">tap</span>
<span style="font-size:12px;color:#5d6273"> by </span><span style="font-size:12px;font-weight:bold;color:#060a2f">tech</span><span style="font-size:12px;font-weight:bold;color:#2b9ad6">sorted</span>
</td></tr>
<tr><td style="padding:16px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1d2030">
${body}
</td></tr>
</table>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#7a8091;margin:14px 0 0;max-width:560px">${e(FOOT)}</p>
</td></tr></table>
</body></html>`;
}

function details(rows) {
  const r = rows.filter(([, v]) => v);
  if (!r.length) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:18px 0;background:#f6f8fb;border-radius:8px">
${r.map(([k, v]) => `<tr><td style="padding:8px 14px;font-size:13px;color:#5d6273;width:40%">${e(k)}</td><td style="padding:8px 14px;font-size:14px;color:#060a2f;font-weight:bold">${e(v)}</td></tr>`).join("")}
</table>`;
}

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px"><tr><td style="border-radius:8px;background:#060a2f">
<a href="${e(href)}" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px">${e(label)}</a>
</td></tr></table>`;
}

const greet = (name) => `Hi ${name ? name.split(" ")[0] : "there"},`;

// ---------------------------------------------------------------- invite

export function inviteEmail({ v, link, expires }) {
  const subject = `Your Tap Sign agreement for ${v.business_name}`;
  const rows = [
    ["Business", v.business_name],
    ["Xero quote", v.quote_number],
    ["Signs", v.sign_count],
  ];
  const text = `${greet(v.contact_name)}

Thanks for going ahead with Tap Signs. Your service agreement for ${v.business_name} is ready.

It's one page: check your details, read it through, then sign on your phone or computer. It takes about two minutes.

${link}

${rows.filter(([, x]) => x).map(([k, x]) => `${k}: ${x}`).join("\n")}

This link is just for you and works until ${expires}. Once you've signed, you'll get a PDF copy by email.

Any questions, just reply to this email or call me on 027 652 5216.

Shaun
tap by techsorted

${FOOT}`;

  const html = layout({
    preheader: `Your one-page Tap Sign agreement for ${v.business_name} is ready to sign.`,
    body: `<p style="margin:0 0 12px">${e(greet(v.contact_name))}</p>
<p style="margin:0 0 12px">Thanks for going ahead with Tap Signs. Your service agreement for <b>${e(v.business_name)}</b> is ready.</p>
<p style="margin:0 0 16px">It's one page: check your details, read it through, then sign on your phone or computer. It takes about two minutes.</p>
${button(link, "Review and sign")}
${details(rows)}
<p style="margin:0 0 12px;font-size:13px;color:#5d6273">This link is just for you and works until ${e(expires)}. Once you've signed, you'll get a PDF copy by email.<br>If the button doesn't work, copy this into your browser: <span style="color:#2b9ad6;word-break:break-all">${e(link)}</span></p>
<p style="margin:0 0 12px">Any questions, just reply to this email or call me on 027 652 5216.</p>
<p style="margin:0">Shaun<br><span style="color:#5d6273">tap by techsorted</span></p>`,
  });
  return { subject, text, html };
}

// ---------------------------------------------------------------- signed copy

export function signedEmail({ a, when }) {
  const subject = `Signed: Tap Sign agreement for ${a.business_name} (${a.id})`;
  const rows = [
    ["Reference", a.id],
    ["Signed by", a.signed_name],
    ["Signed", when],
    ["Agreement", `Version ${a.terms_version}`],
  ];
  const steps = [
    "You'll get the invoice for setup and signs.",
    "Once it's paid, we build your page and print your signs.",
    "You approve the page, then your signs go out on your tables.",
  ];
  const text = `${greet(a.contact_person)}

Thanks for signing. Your signed Tap Sign agreement for ${a.business_name} is attached as a PDF, so keep it for your records.

${rows.map(([k, x]) => `${k}: ${x}`).join("\n")}

What happens next
${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Any questions, just reply to this email or call me on 027 652 5216.

Shaun
tap by techsorted

${FOOT}`;

  const html = layout({
    preheader: `Your signed agreement ${a.id} is attached.`,
    body: `<p style="margin:0 0 12px">${e(greet(a.contact_person))}</p>
<p style="margin:0 0 4px">Thanks for signing. Your signed Tap Sign agreement for <b>${e(a.business_name)}</b> is attached as a PDF, so keep it for your records.</p>
${details(rows)}
<p style="margin:0 0 6px;font-weight:bold;color:#060a2f">What happens next</p>
<ol style="margin:0 0 16px;padding-left:20px">${steps.map((s) => `<li style="margin-bottom:4px">${e(s)}</li>`).join("")}</ol>
<p style="margin:0 0 12px">Any questions, just reply to this email or call me on 027 652 5216.</p>
<p style="margin:0">Shaun<br><span style="color:#5d6273">tap by techsorted</span></p>`,
  });
  return { subject, text, html };
}
