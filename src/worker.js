// tap-join: online sign-up and e-signing for Tap Sign customers.
//
// Public (join.techsorted.nz):
//   GET  /j/<code>                 the customer's sign-up page (details, terms, tick boxes, typed signature)
//   POST /j/<code>                 sign: Turnstile check, stamp the PDF, store it, email it, ping Telegram
//   GET  /j/<code>/agreement.pdf   the signed copy (for 30 days after signing)
//   GET  /agreement.pdf            the current blank agreement, to read or print
//
// Admin (Cloudflare Access login):
//   GET  /admin                    make sign-up links, see who's signed, download PDFs
//   POST /admin/invites            make a link (optionally email it to the customer)
//   POST /admin/invites/<code>/revoke
//   GET  /admin/agreements/<id>.pdf
//
// Storage: D1 (binding DB) for invites and agreement records, R2 (binding AGREEMENTS) for the signed PDFs.
// Secrets: TURNSTILE_SECRET, SMTP2GO_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID. Everything else is in wrangler.toml.

import template from "../assets/agreement-template.pdf";
import blank from "../assets/agreement-blank.pdf";
import meta from "../assets/agreement.json";
import fontRegular from "../assets/Outfit-Regular.ttf";
import fontSignature from "../assets/Caveat-Medium.ttf";
import terms from "../agreement/terms.html";

import { verifyAccessJwt } from "./access.js";
import { stampAgreement } from "./pdf.js";
import { sendEmail, sendTelegram, verifyTurnstile } from "./notify.js";
import { validateSignup, validateInvite, escapeHtml } from "./validate.js";
import { joinPage, signedPage, statusPage, adminPage } from "./pages.js";

const TZ = "Pacific/Auckland";
const DOWNLOAD_DAYS = 30;
const CODE_RE = /^[A-Za-z0-9_-]{22}$/;
const ID_RE = /^TAP-\d{8}-[A-Z0-9]{4}$/;

const termsBody = terms.replace(/<!--[\s\S]*?-->/g, "");

export default {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch (e) {
      console.log(`[error] ${e?.stack || e}`);
      return html(statusPageError(), 500);
    }
  },
};

async function route(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method;

  if (method === "POST" && !sameOrigin(request, url)) return text("Forbidden", 403);

  if (path === "/") return Response.redirect("https://techsorted.nz/tap/", 302);
  if (path === "/agreement.pdf" && method === "GET") return pdf(blank, `Tap-Sign-Service-Agreement-v${meta.version}.pdf`, "inline");

  let m;
  if ((m = path.match(/^\/j\/([^/]+)$/))) {
    if (method === "GET") return showJoin(env, m[1]);
    if (method === "POST") return submitJoin(request, env, ctx, m[1]);
  }
  if ((m = path.match(/^\/j\/([^/]+)\/agreement\.pdf$/)) && method === "GET") return customerDownload(env, m[1]);

  if (path === "/admin" || path.startsWith("/admin/")) {
    if (!(await isAdmin(request, env, url))) {
      return text("Sign in with Cloudflare Access to open the admin page.", 401);
    }
    if (path === "/admin" && method === "GET") return showAdmin(env, url);
    if (path === "/admin/invites" && method === "POST") return createInvite(request, env, url);
    if ((m = path.match(/^\/admin\/invites\/([^/]+)\/revoke$/)) && method === "POST") return revokeInvite(env, m[1]);
    if ((m = path.match(/^\/admin\/agreements\/([^/]+)\.pdf$/)) && method === "GET") return adminDownload(env, m[1]);
  }

  return text("Not found", 404);
}

// ------------------------------------------------------------------ customer

async function loadInvite(env, code) {
  if (!CODE_RE.test(code)) return null;
  return env.DB.prepare("SELECT * FROM invites WHERE code = ?").bind(code).first();
}

function inviteProblem(invite) {
  if (!invite) return "notfound";
  if (invite.revoked_at) return "revoked";
  if (!invite.signed_at && invite.expires_at < new Date().toISOString()) return "expired";
  return null;
}

async function showJoin(env, code) {
  const invite = await loadInvite(env, code);
  const problem = inviteProblem(invite);
  if (problem) return html(statusPage(problem), problem === "notfound" ? 404 : 410);
  if (invite.signed_at) return showSigned(env, invite, null);
  return html(joinPage({ invite, terms: termsBody, version: meta.version, sitekey: env.TURNSTILE_SITEKEY, today: nzDate(new Date()) }));
}

async function showSigned(env, invite, emailOk) {
  const agreement = await env.DB.prepare("SELECT * FROM agreements WHERE id = ?").bind(invite.agreement_id).first();
  if (!agreement) return html(statusPage("notfound"), 404);
  return html(signedPage({ invite, agreement, emailOk: emailOk ?? !!agreement.email_sent }));
}

async function submitJoin(request, env, ctx, code) {
  const invite = await loadInvite(env, code);
  const problem = inviteProblem(invite);
  if (problem) return html(statusPage(problem), problem === "notfound" ? 404 : 410);
  if (invite.signed_at) return redirect(`/j/${code}`);

  const form = await request.formData();
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const check = validateSignup(form, invite);
  const again = (message, status = 400) =>
    html(
      joinPage({
        invite,
        terms: termsBody,
        version: meta.version,
        sitekey: env.TURNSTILE_SITEKEY,
        values: check.values,
        errors: check.errors,
        signedName: check.signedName,
        message,
        today: nzDate(new Date()),
      }),
      status
    );

  if (!check.ok) return again("Please fix the highlighted items, then sign again.");
  const skipTurnstile = isLocalDev(env, new URL(request.url)) && env.DEV_SKIP_TURNSTILE === "yes";
  if (!skipTurnstile && !(await verifyTurnstile(env, form.get("cf-turnstile-response"), ip))) {
    return again("We couldn't confirm you're a person. Please try again.");
  }

  // Claim the invite first, so a double tap can't sign twice.
  const now = new Date();
  const nowIso = now.toISOString();
  const claim = await env.DB.prepare(
    "UPDATE invites SET signed_at = ? WHERE code = ? AND signed_at IS NULL AND revoked_at IS NULL AND expires_at > ?"
  )
    .bind(nowIso, code, nowIso)
    .run();
  if (claim.meta.changes !== 1) return redirect(`/j/${code}`);

  const id = agreementId(now);
  const v = check.values;
  const dateText = nzDate(now);
  const record =
    `Signed electronically by ${check.signedName} (${v.accounts_email}) on ${nzDateTime(now)} from ${ip || "unknown IP"}` +
    ` · Ref ${id} · Agreement v${meta.version}`;

  let bytes, sha, key;
  try {
    bytes = await stampAgreement({
      template,
      meta,
      fonts: { regular: fontRegular, signature: fontSignature },
      fields: {
        ...v,
        customer_signatory: check.signedName,
        customer_date: dateText,
        techsorted_signatory: env.COUNTERSIGN_NAME || "Shaun",
        techsorted_date: dateText,
      },
      customerSignature: check.signedName,
      techsortedSignature: env.COUNTERSIGN_NAME || "Shaun",
      record,
      id,
    });
    sha = await sha256Hex(bytes);
    key = `agreements/${now.getUTCFullYear()}/${id}.pdf`;
    await env.AGREEMENTS.put(key, bytes, {
      httpMetadata: { contentType: "application/pdf" },
      customMetadata: { business: v.business_name, sha256: sha, version: meta.version },
    });
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO agreements (id, invite_code, terms_version, business_name, legal_entity, contact_person, contact_role, phone,
          accounts_email, business_address, forms_email, page_slug, quote_number, sign_count, signed_name, signed_at, ip, country,
          user_agent, countersigned_by, pdf_key, pdf_sha256)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, code, meta.version, v.business_name, v.legal_entity, v.contact_person, v.contact_role, v.phone,
        v.accounts_email, v.business_address, v.forms_email, v.page_slug, v.quote_number, v.sign_count, check.signedName, nowIso, ip,
        request.cf?.country || "", (request.headers.get("User-Agent") || "").slice(0, 300), env.COUNTERSIGN_NAME || "Shaun", key, sha
      ),
      env.DB.prepare("UPDATE invites SET agreement_id = ? WHERE code = ?").bind(id, code),
    ]);
  } catch (e) {
    // Undo the claim so they can try again.
    console.log(`[sign failed] ${e?.stack || e}`);
    await env.DB.prepare("UPDATE invites SET signed_at = NULL WHERE code = ? AND agreement_id IS NULL").bind(code).run();
    if (key) await env.AGREEMENTS.delete(key).catch(() => {});
    return again("Sorry, something went wrong saving your signature. Please try again, or call 027 652 5216.", 500);
  }

  // Send the copy and the ping before replying, so the page can say whether the email went.
  const filename = `Tap-Sign-Agreement-${slugish(v.business_name)}-${id}.pdf`;
  const recipients = [...new Set([v.accounts_email, invite.contact_email].filter(Boolean).map((s) => s.toLowerCase()))];
  const mail = await sendEmail(env, {
    to: recipients,
    bcc: env.NOTIFY_EMAIL ? [env.NOTIFY_EMAIL] : [],
    subject: `Your signed Tap Sign agreement (${id})`,
    text: signedEmailText({ v, id, name: check.signedName, when: nzDateTime(now) }),
    html: signedEmailHtml({ v, id, name: check.signedName, when: nzDateTime(now) }),
    attachment: { filename, bytes },
  });
  if (mail.ok) await env.DB.prepare("UPDATE agreements SET email_sent = 1 WHERE id = ?").bind(id).run();

  ctx.waitUntil(
    sendTelegram(
      env,
      [
        `✍️ ${v.business_name} signed the Tap Sign agreement`,
        `Ref ${id} (v${meta.version})`,
        `Signed by ${check.signedName}${v.contact_role ? ` (${v.contact_role})` : ""}`,
        [v.quote_number && `Quote ${v.quote_number}`, v.sign_count && `${v.sign_count} signs`, v.page_slug && `tap.techsorted.nz/${v.page_slug}`]
          .filter(Boolean)
          .join(" · "),
        mail.ok ? "Signed copy emailed to them and you." : "⚠️ The email copy didn't send. Download it from the admin page.",
        "Next: send the setup and signs invoice.",
        `${env.PUBLIC_ORIGIN}/admin`,
      ]
        .filter(Boolean)
        .join("\n")
    )
  );

  return redirect(`/j/${code}?signed=1`);
}

async function customerDownload(env, code) {
  const invite = await loadInvite(env, code);
  if (!invite || !invite.agreement_id) return html(statusPage("notfound"), 404);
  const a = await env.DB.prepare("SELECT id, pdf_key, signed_at, business_name FROM agreements WHERE id = ?").bind(invite.agreement_id).first();
  if (!a) return html(statusPage("notfound"), 404);
  if (Date.now() - Date.parse(a.signed_at) > DOWNLOAD_DAYS * 86400_000) return html(statusPage("downloadgone"), 410);
  const obj = await env.AGREEMENTS.get(a.pdf_key);
  if (!obj) return html(statusPage("notfound"), 404);
  return pdf(obj.body, `Tap-Sign-Agreement-${slugish(a.business_name)}-${a.id}.pdf`, "attachment");
}

// ------------------------------------------------------------------ admin

async function isAdmin(request, env, url) {
  // Local development only: `wrangler dev` with DEV_ADMIN=yes in .dev.vars. Never honoured on a real hostname.
  if (isLocalDev(env, url) && env.DEV_ADMIN === "yes") return true;
  return verifyAccessJwt(request, env);
}

function isLocalDev(env, url) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

async function showAdmin(env, url, extra = {}) {
  const [inv, agr] = await Promise.all([
    env.DB.prepare("SELECT * FROM invites ORDER BY created_at DESC LIMIT 200").all(),
    env.DB.prepare("SELECT * FROM agreements ORDER BY signed_at DESC LIMIT 500").all(),
  ]);
  const flash = url.searchParams.get("made")
    ? {
        title: url.searchParams.get("emailed") === "1" ? "Link made and emailed to the customer." : "Link made. Copy it and send it to the customer.",
        link: `${env.PUBLIC_ORIGIN}/j/${url.searchParams.get("made")}`,
        note: url.searchParams.get("emailed") === "0" ? "The email didn't send, so send the link yourself." : "",
      }
    : url.searchParams.get("revoked")
      ? { title: "Link cancelled." }
      : null;
  return html(
    adminPage({ invites: inv.results, agreements: agr.results, origin: env.PUBLIC_ORIGIN, flash, fmt: (iso) => nzDateTime(new Date(iso)), ...extra }),
    extra.errors ? 400 : 200,
    { "Cache-Control": "no-store" }
  );
}

async function createInvite(request, env, url) {
  const form = await request.formData();
  const check = validateInvite(form);
  if (!check.ok) return showAdmin(env, url, { errors: check.errors, values: check.values });
  const v = check.values;
  const code = randomCode();
  const now = new Date();
  const days = Math.min(60, Math.max(1, parseInt(env.INVITE_DAYS || "14", 10) || 14));
  const expires = new Date(now.getTime() + days * 86400_000);
  await env.DB.prepare(
    `INSERT INTO invites (code, created_at, expires_at, business_name, contact_email, page_slug, quote_number, sign_count, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(code, now.toISOString(), expires.toISOString(), v.business_name, v.contact_email, v.page_slug, v.quote_number, v.sign_count, v.note)
    .run();

  let emailed = "";
  if (form.get("send_email") === "yes" && v.contact_email) {
    const link = `${env.PUBLIC_ORIGIN}/j/${code}`;
    const res = await sendEmail(env, {
      to: [v.contact_email],
      subject: `Your Tap Sign agreement for ${v.business_name}`,
      text: inviteEmailText({ v, link, expires: nzDate(expires) }),
      html: inviteEmailHtml({ v, link, expires: nzDate(expires) }),
    });
    emailed = res.ok ? "1" : "0";
  }
  return redirect(`/admin?made=${code}${emailed ? `&emailed=${emailed}` : ""}`);
}

async function revokeInvite(env, code) {
  if (CODE_RE.test(code)) {
    await env.DB.prepare("UPDATE invites SET revoked_at = ? WHERE code = ? AND signed_at IS NULL AND revoked_at IS NULL")
      .bind(new Date().toISOString(), code)
      .run();
  }
  return redirect("/admin?revoked=1");
}

async function adminDownload(env, id) {
  if (!ID_RE.test(id)) return text("Not found", 404);
  const a = await env.DB.prepare("SELECT id, pdf_key, business_name FROM agreements WHERE id = ?").bind(id).first();
  if (!a) return text("Not found", 404);
  const obj = await env.AGREEMENTS.get(a.pdf_key);
  if (!obj) return text("PDF missing from storage", 404);
  return pdf(obj.body, `Tap-Sign-Agreement-${slugish(a.business_name)}-${a.id}.pdf`, "inline");
}

// ------------------------------------------------------------------ emails

function signedEmailText({ v, id, name, when }) {
  return `Hi ${v.contact_person},

Thanks for signing up to Tap Signs. Your signed agreement for ${v.business_name} is attached.

Reference: ${id}
Signed by: ${name}
Signed: ${when}

What happens next:
1. You'll get the invoice for setup and signs.
2. Once it's paid, we build your page and print your signs.
3. You approve the page, then your signs go out on your tables.

Any questions, just reply to this email or call 027 652 5216.

Shaun
tap by techsorted`;
}

function signedEmailHtml(a) {
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1d2030">${escapeHtml(signedEmailText(a)).replace(/\n/g, "<br>")}</div>`;
}

function inviteEmailText({ v, link, expires }) {
  return `Hi,

Here's your Tap Sign Service Agreement for ${v.business_name}. It takes about two minutes to check your details and sign online:

${link}

The link works until ${expires}. You'll get a signed PDF copy by email once it's done.

Any questions, just reply or call 027 652 5216.

Shaun
tap by techsorted`;
}

function inviteEmailHtml({ v, link, expires }) {
  const e = escapeHtml;
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1d2030">
<p>Hi,</p>
<p>Here's your Tap Sign Service Agreement for <b>${e(v.business_name)}</b>. It takes about two minutes to check your details and sign online.</p>
<p><a href="${e(link)}" style="display:inline-block;background:#060a2f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">Review and sign</a></p>
<p style="color:#5d6273;font-size:13px">Or copy this link: ${e(link)}<br>The link works until ${e(expires)}.</p>
<p>You'll get a signed PDF copy by email once it's done. Any questions, just reply or call 027 652 5216.</p>
<p>Shaun<br>tap by techsorted</p></div>`;
}

// ------------------------------------------------------------------ helpers

function sameOrigin(request, url) {
  const origin = request.headers.get("Origin");
  if (origin) return origin === url.origin;
  const ref = request.headers.get("Referer");
  return !!ref && new URL(ref).origin === url.origin;
}

const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; " +
    "connect-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "X-Robots-Tag": "noindex, nofollow",
};

function html(body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...SECURITY_HEADERS, ...extra },
  });
}

function text(body, status) {
  return new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...SECURITY_HEADERS } });
}

function redirect(location) {
  return new Response(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });
}

function pdf(body, filename, disposition) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function statusPageError() {
  return statusPage("notfound").replace("This link doesn't work", "Something went wrong").replace(
    "Check you've copied the whole link, or get in touch and we'll send a new one.",
    "Please try again in a minute, or get in touch."
  );
}

export function nzDate(d) {
  return new Intl.DateTimeFormat("en-NZ", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function nzDateTime(d) {
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: TZ, day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short",
  }).formatToParts(d);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.day} ${p.month} ${p.year} at ${p.hour}:${p.minute} ${String(p.dayPeriod).toLowerCase()} ${p.timeZoneName}`;
}

function randomCode() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function agreementId(d) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const r = crypto.getRandomValues(new Uint8Array(4));
  return `TAP-${ymd}-${[...r].map((x) => alphabet[x % alphabet.length]).join("")}`;
}

async function sha256Hex(bytes) {
  const h = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function slugish(s) {
  return String(s).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "Business";
}
