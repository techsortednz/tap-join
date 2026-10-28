// HTML for the public sign-up pages and the admin page. Every value goes through esc().

import { CUSTOMER_FIELDS, escapeHtml as esc } from "./validate.js";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Orbitron:wght@700;800&family=Outfit:wght@400;500;600&display=swap";

const MARK = `<svg class="mk" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#f3eee4"/><g fill="none" stroke="#060a2f" stroke-width="4.5" stroke-linecap="round"><path d="M22 25.5a10 10 0 0 1 0 13"/><path d="M29.5 19.5a19 19 0 0 1 0 25"/><path d="M37 13.5a28 28 0 0 1 0 37"/></g><circle cx="15.5" cy="32" r="3.6" fill="#2b9ad6"/></svg>`;

const BRAND = `<a class="brand" href="https://techsorted.nz/tap/">${MARK}<span class="wt"><b>tap</b><span class="by"><i>by </i>tech<em>sorted</em></span></span></a>`;

const CSS = `
:root{--navy:#060a2f;--blue:#2b9ad6;--ink:#1d2030;--muted:#5d6273;--line:#d5d9e2;--tint:#f3f6fa;--bg:#fbfcfe;--card:#fff;--err:#b42318;--ok:#067647}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:Outfit,system-ui,sans-serif;font-size:16px;line-height:1.5;color:var(--ink);background:var(--bg)}
a{color:var(--blue)}
.wrap{max-width:46rem;margin:0 auto;padding:0 16px}
header.top{border-bottom:1px solid var(--line);background:#fff}
header.top .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
.brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:var(--navy)}
.brand .mk{width:36px;height:36px}
.brand .wt{display:flex;flex-direction:column;gap:3px}
.brand b{font-family:Orbitron,sans-serif;font-weight:800;font-size:22px;line-height:.9}
.brand .by{font-family:Orbitron,sans-serif;font-weight:700;font-size:9px;letter-spacing:.06em;white-space:nowrap}
.brand .by i{font-family:Outfit,sans-serif;font-style:normal;font-weight:500;color:var(--muted)}
.brand .by em{font-style:normal;color:var(--blue)}
.top small{color:var(--muted);font-size:13px}
main{padding:28px 0 64px}
h1{font-size:28px;line-height:1.15;color:var(--navy);font-weight:600;letter-spacing:-.01em}
.lead{margin-top:8px;color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 16px;margin-top:20px}
@media(min-width:640px){.card{padding:24px}}
.step{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.step span{flex:none;width:26px;height:26px;border-radius:50%;background:var(--navy);color:#fff;font-size:13px;font-weight:600;display:grid;place-items:center}
.step h2{font-size:18px;color:var(--navy);font-weight:600}
.fields{display:grid;gap:14px}
@media(min-width:640px){.fields{grid-template-columns:1fr 1fr}.fields .wide{grid-column:1/-1}}
label.l{display:block;font-size:14px;font-weight:500;color:var(--navy);margin-bottom:4px}
label.l .opt{font-weight:400;color:var(--muted)}
input[type=text],input[type=email],input[type=tel]{width:100%;height:46px;border:1px solid #b9c0cf;border-radius:10px;padding:0 12px;font:inherit;color:var(--ink);background:#fff}
input:focus-visible,button:focus-visible,a:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.hint{font-size:13px;color:var(--muted);margin-top:4px}
.err{font-size:13px;color:var(--err);margin-top:4px;font-weight:500}
.bad input{border-color:var(--err)}
.locked{background:var(--tint);border-radius:10px;padding:10px 12px;min-height:46px}
.locked .v{font-weight:500;color:var(--navy);overflow-wrap:anywhere}
.locked .l2{font-size:13px;color:var(--muted)}
.terms{font-size:14px;line-height:1.5}
.terms .cols{display:block}
.terms section{margin-bottom:16px}
.terms h2{font-size:13px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
.terms p{margin-bottom:6px}
.terms ul,.terms ol{padding-left:20px;margin-bottom:6px}
.terms li{margin-bottom:4px}
.terms b{color:var(--navy);font-weight:600}
.scroll{max-height:60vh;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--tint)}
.pdflink{display:inline-block;margin-top:12px;font-size:14px}
.check{display:flex;gap:12px;align-items:flex-start;padding:12px;border:1px solid var(--line);border-radius:12px;margin-bottom:10px;cursor:pointer}
.check input{flex:none;width:22px;height:22px;margin-top:1px;accent-color:var(--navy)}
.check.bad{border-color:var(--err)}
.sigprev{margin-top:10px;min-height:56px;border-bottom:1px solid #9aa1b2;font-family:Caveat,cursive;font-size:34px;color:var(--navy);line-height:1.4;overflow:hidden;white-space:nowrap}
.sigmeta{font-size:13px;color:var(--muted);margin-top:4px}
.ts{margin:16px 0 4px;min-height:0}
button.go{width:100%;height:52px;border:0;border-radius:999px;background:var(--navy);color:#fff;font:inherit;font-weight:600;font-size:17px;cursor:pointer;margin-top:12px}
button.go[disabled]{opacity:.6}
.alert{border-radius:12px;padding:12px 14px;margin-top:16px;font-size:15px}
.alert.e{background:#fef3f2;color:var(--err);border:1px solid #fecdca}
.alert.o{background:#ecfdf3;color:var(--ok);border:1px solid #abefc6}
.big{font-size:56px;line-height:1}
.busy{position:fixed;inset:0;z-index:50;background:rgba(251,252,254,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center;color:var(--navy);font-size:17px}
.busy[hidden]{display:none}
.busy span{color:var(--muted);font-size:15px;max-width:22rem}
.spin{width:40px;height:40px;border-radius:50%;border:4px solid var(--line);border-top-color:var(--navy);animation:sp .8s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.spin{animation-duration:2.4s}}
.ref{font-family:ui-monospace,Menlo,monospace;font-size:14px;background:var(--tint);padding:2px 8px;border-radius:6px}
.btn{display:inline-flex;align-items:center;justify-content:center;height:46px;padding:0 20px;border-radius:999px;background:var(--navy);color:#fff;text-decoration:none;font-weight:600;margin-top:16px}
.btn.alt{background:#fff;color:var(--navy);border:1px solid var(--line)}
footer.f{color:var(--muted);font-size:13px;text-align:center;padding:24px 16px 40px}
/* admin */
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.tablewrap{overflow-x:auto}
.mini{font-size:13px;color:var(--muted)}
.pill{display:inline-block;font-size:12px;padding:1px 8px;border-radius:999px;background:var(--tint);color:var(--muted)}
.pill.ok{background:#ecfdf3;color:var(--ok)}
.pill.no{background:#fef3f2;color:var(--err)}
.linkbox{display:flex;gap:8px;margin-top:8px}
.linkbox input{flex:1;font-size:14px}
.linkbox button,.smallbtn{height:46px;padding:0 14px;border-radius:10px;border:1px solid var(--line);background:#fff;font:inherit;cursor:pointer}
.smallbtn{height:32px;font-size:13px;padding:0 10px}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
`;

export function layout({ title, body, script = "", turnstile = false, admin = false }) {
  return `<!doctype html>
<html lang="en-NZ">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
${turnstile ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : ""}
<style>${CSS}</style>
</head>
<body>
<header class="top"><div class="wrap">${BRAND}${admin ? `<small><a href="/" style="color:inherit;text-decoration:none">← Hub</a></small>` : ""}</div></header>
<main><div class="wrap">
${body}
</div></main>
<footer class="f">tap by techsorted · 027 652 5216 · <a href="mailto:shaun@techsorted.nz">shaun@techsorted.nz</a></footer>
${script ? `<script>${script}</script>` : ""}
</body>
</html>`;
}

// ------------------------------------------------------------------ public

export function joinPage({ invite, terms, version, sitekey, values = {}, errors = {}, signedName = "", message = "", today }) {
  const v = (name) => (name in values ? values[name] : "");
  const field = (f) => {
    if (f.locked) {
      const val = invite[f.name];
      if (!val) return "";
      return `<div class="${f.name === "business_name" ? "wide" : ""}"><span class="l" style="display:block;font-size:14px;font-weight:500;color:var(--navy);margin-bottom:4px">${esc(f.label)}</span><div class="locked"><div class="v">${esc((f.prefix || "") + val)}</div><div class="l2">Set by tap by techsorted</div></div></div>`;
    }
    const wide = f.name === "business_address" ? "wide" : "";
    const e = errors[f.name];
    const fromInvite = { accounts_email: invite.contact_email, contact_person: invite.contact_name }[f.name];
    const pre = f.name in values ? v(f.name) : fromInvite || "";
    return `<div class="${wide} ${e ? "bad" : ""}">
<label class="l" for="${f.name}">${esc(f.label)}${f.required ? "" : ' <span class="opt">(optional)</span>'}</label>
<input id="${f.name}" name="${f.name}" type="${f.type || "text"}" value="${esc(pre)}" maxlength="${f.max}" ${f.required ? "required" : ""} autocomplete="${auto(f.name)}">
${e ? `<div class="err">${esc(e)}</div>` : f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ""}
</div>`;
  };
  const chk = (name, text) =>
    `<label class="check ${errors[name] ? "bad" : ""}"><input type="checkbox" name="${name}" value="yes" required> <span>${text}${errors[name] ? `<div class="err">${esc(errors[name])}</div>` : ""}</span></label>`;

  const body = `
<h1>Tap Sign Service Agreement</h1>
<p class="lead">For <b>${esc(invite.business_name)}</b>. Check your details, read the agreement, then sign at the bottom. It takes about two minutes, and you'll get a signed PDF copy by email.</p>
${message ? `<div class="alert e" role="alert">${esc(message)}</div>` : ""}
<form method="post" id="f" novalidate>
<div class="card">
  <div class="step"><span>1</span><h2>Your details</h2></div>
  <div class="fields">${CUSTOMER_FIELDS.map(field).join("")}</div>
</div>

<div class="card">
  <div class="step"><span>2</span><h2>The agreement</h2></div>
  <div class="scroll terms" tabindex="0" aria-label="Agreement terms">${terms}</div>
  <a class="pdflink" href="/agreement.pdf" target="_blank" rel="noopener">Download the agreement as a PDF (v${esc(version)})</a>
</div>

<div class="card">
  <div class="step"><span>3</span><h2>Sign</h2></div>
  ${chk("agree", `I have read and agree to the Tap Sign Service Agreement (version ${esc(version)}).`)}
  ${chk("authority", `I am authorised to sign this agreement on behalf of ${esc(invite.business_name)}.`)}
  <div class="${errors.signed_name ? "bad" : ""}" style="margin-top:14px">
    <label class="l" for="signed_name">Type your full name to sign</label>
    <input id="signed_name" name="signed_name" type="text" value="${esc(signedName)}" maxlength="80" required autocomplete="name">
    ${errors.signed_name ? `<div class="err">${esc(errors.signed_name)}</div>` : ""}
    <div class="sigprev" id="sigprev" aria-hidden="true">${esc(signedName)}</div>
    <div class="sigmeta">Electronic signature · ${esc(today)}</div>
  </div>
  <div class="ts cf-turnstile" data-sitekey="${esc(sitekey)}" data-action="sign" data-size="flexible"></div>
  <button class="go" type="submit" id="go">Sign agreement</button>
  <div id="busy" class="busy" hidden role="status" aria-live="polite"><div class="spin" aria-hidden="true"></div><b>Signing your agreement…</b><span>This takes a few seconds. Please don't refresh or close this page.</span></div>
  <p class="hint" style="text-align:center;margin-top:10px">Typing your name and pressing Sign is your signature. We record the date, time and your IP address with it.</p>
</div>
</form>`;

  const script = `
var n=document.getElementById('signed_name'),p=document.getElementById('sigprev');
n.addEventListener('input',function(){p.textContent=n.value});
document.getElementById('f').addEventListener('submit',function(){var b=document.getElementById('go');b.disabled=true;b.textContent='Signing…';document.getElementById('busy').hidden=false});
`;
  return layout({ title: `Sign up – ${invite.business_name}`, body, script, turnstile: true });
}

export function signedPage({ invite, agreement, emailOk }) {
  const body = `
<div class="card" style="text-align:center">
  <div class="big" aria-hidden="true">✓</div>
  <h1 style="margin-top:12px">Signed, thank you</h1>
  <p class="lead">${esc(agreement.signed_name)} signed the Tap Sign Service Agreement for <b>${esc(invite.business_name)}</b>.</p>
  <p style="margin-top:10px">Reference <span class="ref">${esc(agreement.id)}</span></p>
  <a class="btn" href="/j/${esc(invite.code)}/agreement.pdf">Download your signed copy</a>
  <p class="hint" style="margin-top:12px">${emailOk ? `A copy has also been emailed to ${esc(agreement.accounts_email)}.` : `A copy is on its way to ${esc(agreement.accounts_email)}. It can take a few minutes to arrive.`}</p>
</div>
<div class="card">
  <div class="step"><span>→</span><h2>What happens next</h2></div>
  <ol class="terms" style="padding-left:20px">
    <li>You'll get the invoice for setup and signs.</li>
    <li>Once it's paid, we build your page and print your signs.</li>
    <li>You approve the page, then your signs go out on your tables.</li>
  </ol>
</div>`;
  return layout({ title: "Signed – tap by techsorted", body });
}

export function statusPage(kind) {
  const text = {
    notfound: ["This link doesn't work", "Check you've copied the whole link, or get in touch and we'll send a new one."],
    expired: ["This link has expired", "Sign-up links last a couple of weeks. Get in touch and we'll send you a fresh one."],
    revoked: ["This link has been cancelled", "Get in touch if you still want to go ahead."],
    downloadgone: ["This copy is no longer available here", "Your signed copy was emailed to you. Get in touch if you need it again."],
  }[kind];
  const body = `<div class="card" style="text-align:center"><h1>${esc(text[0])}</h1><p class="lead">${esc(text[1])}</p>
<a class="btn" href="mailto:shaun@techsorted.nz">Email Shaun</a> <a class="btn alt" href="tel:+64276525216">Call 027 652 5216</a></div>`;
  return layout({ title: text[0], body });
}

// ------------------------------------------------------------------ admin

export function adminPage({ invites, agreements, origin, flash = null, errors = {}, values = {}, fmt }) {
  const pending = invites.filter((i) => !i.signed_at);
  const state = (i) =>
    i.revoked_at ? '<span class="pill no">Cancelled</span>' : i.expires_at < new Date().toISOString() ? '<span class="pill no">Expired</span>' : '<span class="pill">Waiting</span>';
  const link = (code) => `${origin}/j/${code}`;
  const inp = (name, label, opts = "", wide = false) =>
    `<div class="${wide ? "wide " : ""}${errors[name] ? "bad" : ""}"><label class="l" for="${name}">${label}</label><input id="${name}" name="${name}" type="text" value="${esc(values[name] || "")}" ${opts}>${errors[name] ? `<div class="err">${esc(errors[name])}</div>` : ""}</div>`;

  const body = `
<h1>Agreements</h1>
<p class="lead">Sign-up links for new Tap Sign customers, and their signed agreements.</p>
${flash ? `<div class="alert o" role="status"><b>${esc(flash.title)}</b>${flash.link ? `<div class="linkbox"><input type="text" readonly value="${esc(flash.link)}" id="newlink"><button type="button" data-copy="newlink">Copy</button></div>` : ""}${flash.note ? `<div style="margin-top:6px">${esc(flash.note)}</div>` : ""}</div>` : ""}

<div class="card">
  <div class="step"><span>+</span><h2>New sign-up link</h2></div>
  <form method="post" action="/agreements/invites">
    <div class="fields">
      ${inp("business_name", "Business name", 'required maxlength="120"', true)}
      ${inp("contact_name", "Contact name <span class=\"opt\">(optional)</span>", 'maxlength="80" placeholder="Paul Smith"')}
      ${inp("contact_email", "Customer email <span class=\"opt\">(link is emailed here)</span>", 'maxlength="120" inputmode="email"')}
      ${inp("page_slug", "Page slug <span class=\"opt\">(optional)</span>", 'maxlength="30" placeholder="coffeenation"')}
      ${inp("quote_number", "Xero quote no. <span class=\"opt\">(optional)</span>", 'maxlength="30"')}
      ${inp("sign_count", "Number of signs <span class=\"opt\">(optional)</span>", 'maxlength="4" inputmode="numeric"')}
      ${inp("note", "Private note <span class=\"opt\">(optional)</span>", 'maxlength="300"', true)}
    </div>
    <p class="hint" style="margin-top:12px">If you add a customer email, the link is emailed to them straight away.</p>
    <button class="go" type="submit">Create link</button>
  </form>
</div>

<div class="card">
  <div class="step"><span>${pending.length}</span><h2>Waiting to be signed</h2></div>
  ${pending.length ? `<div class="tablewrap"><table><tr><th>Business</th><th>Link</th><th>Status</th><th></th></tr>
  ${pending.map((i) => `<tr><td><b>${esc(i.business_name)}</b><div class="mini">${esc([i.quote_number, i.sign_count ? `${i.sign_count} signs` : "", i.page_slug].filter(Boolean).join(" · "))}</div>${i.note ? `<div class="mini">${esc(i.note)}</div>` : ""}<div class="mini">Made ${esc(fmt(i.created_at))} · expires ${esc(fmt(i.expires_at))}</div></td>
  <td><input type="text" readonly value="${esc(link(i.code))}" id="l-${esc(i.code)}" style="height:32px;font-size:12px;min-width:12rem"><button type="button" class="smallbtn" data-copy="l-${esc(i.code)}">Copy</button></td>
  <td>${state(i)}</td>
  <td>${i.revoked_at || i.expires_at < new Date().toISOString() ? "" : `${i.contact_email ? `<form method="post" action="/agreements/invites/${esc(i.code)}/email"><button class="smallbtn" type="submit">${i.emailed_at ? "Resend link" : "Send link"}</button></form><div class="mini" style="margin:2px 0 6px">${i.emailed_at ? `Emailed ${esc(fmt(i.emailed_at))}` : "Not emailed yet"}</div>` : '<div class="mini" style="margin-bottom:6px">No email: copy the link</div>'}<form method="post" action="/agreements/invites/${esc(i.code)}/revoke" onsubmit="return confirm('Cancel this link?')"><button class="smallbtn" type="submit">Cancel</button></form>`}</td></tr>`).join("")}
  </table></div>` : '<p class="mini">Nothing waiting.</p>'}
</div>

<div class="card">
  <div class="step"><span>${agreements.length}</span><h2>Signed</h2></div>
  ${agreements.length ? `<div class="tablewrap"><table><tr><th>Business</th><th>Signed</th><th>PDF</th></tr>
  ${agreements.map((a) => `<tr><td><b>${esc(a.business_name)}</b><div class="mini">${esc(a.id)} · v${esc(a.terms_version)}</div><div class="mini">${esc(a.contact_person)} · ${esc(a.accounts_email)}</div></td>
  <td>${esc(a.signed_name)}<div class="mini">${esc(fmt(a.signed_at))}</div>${a.email_sent ? "" : '<div class="mini" style="color:var(--err)">Copy not emailed</div>'}</td>
  <td><a href="/agreements/signed/${esc(a.id)}.pdf">PDF</a><form method="post" action="/agreements/signed/${esc(a.id)}/resend" style="margin-top:6px"><button class="smallbtn" type="submit">${a.email_sent ? "Resend copy" : "Send copy"}</button></form></td></tr>`).join("")}
  </table></div>` : '<p class="mini">No signed agreements yet.</p>'}
</div>`;

  const script = `document.addEventListener('click',function(e){var b=e.target.closest('[data-copy]');if(!b)return;var i=document.getElementById(b.dataset.copy);i.select();try{navigator.clipboard.writeText(i.value)}catch(_){document.execCommand('copy')}b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)});`;
  return layout({ title: "Agreements – tap by techsorted", body, script, admin: true });
}

function auto(name) {
  return (
    {
      contact_person: "name",
      phone: "tel",
      accounts_email: "email",
      forms_email: "email",
      business_address: "street-address",
      legal_entity: "organization",
      contact_role: "organization-title",
    }[name] || "off"
  );
}

// ------------------------------------------------------------------ hub home

export function hubPage({ waiting, signed, latest }) {
  const card = (href, title, text, extra = "") =>
    `<a class="card hubcard" href="${href}"><h2>${title}</h2><p>${text}</p>${extra}<span class="go2">Open →</span></a>`;
  const body = `
<h1>techsorted hub</h1>
<p class="lead">Your private Tap tools, behind one login.</p>
<div class="hubgrid">
${card("/stats/", "Stats", "Page views, Google reviews and form enquiries for every cafe.")}
${card("/agreements", "Agreements", "Make sign-up links and see signed agreements.",
  `<p class="mini">${esc(String(waiting))} waiting · ${esc(String(signed))} signed${latest ? ` · latest ${esc(latest)}` : ""}</p>`)}
</div>
<p class="mini" style="margin-top:20px">Customer sign-up pages live at jointap.techsorted.nz.</p>`;
  return layout({ title: "techsorted hub", body, admin: false }).replace(
    "</style>",
    `.hubgrid{display:grid;gap:14px;margin-top:8px}@media(min-width:640px){.hubgrid{grid-template-columns:1fr 1fr}}
.hubcard{display:block;text-decoration:none;color:inherit;transition:border-color .15s}
.hubcard:hover{border-color:var(--blue)}
.hubcard h2{font-size:20px;color:var(--navy);margin-bottom:6px}
.hubcard p{color:var(--muted);font-size:15px;margin-bottom:6px}
.go2{display:inline-block;margin-top:8px;font-weight:600;color:var(--blue)}</style>`
  );
}
