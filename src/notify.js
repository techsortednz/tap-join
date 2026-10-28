// Outgoing messages: SMTP2GO email (with the signed PDF attached) and a Telegram ping to Shaun.
// Both are best-effort: a failure is logged and reported back, never blocks a signature.

export async function sendEmail(env, { to, bcc = [], subject, text, html, attachment }) {
  if (!env.SMTP2GO_API_KEY) {
    console.log(`[email skipped: no SMTP2GO_API_KEY] to=${to.join(",")} subject=${subject}`);
    return { ok: false, skipped: true };
  }
  const body = {
    sender: env.MAIL_FROM,
    to,
    subject,
    text_body: text,
    html_body: html,
  };
  if (bcc.length) body.bcc = bcc;
  if (attachment) {
    body.attachments = [{ filename: attachment.filename, fileblob: toBase64(attachment.bytes), mimetype: "application/pdf" }];
  }
  try {
    const res = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Smtp2go-Api-Key": env.SMTP2GO_API_KEY },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    const ok = res.ok && data?.data?.succeeded >= 1;
    if (!ok) console.log(`[email failed] ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
    return { ok };
  } catch (e) {
    console.log(`[email error] ${e}`);
    return { ok: false };
  }
}

export async function sendTelegram(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.log(`[telegram skipped] ${text}`);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    });
    if (!res.ok) console.log(`[telegram failed] ${res.status}`);
    return { ok: res.ok };
  } catch (e) {
    console.log(`[telegram error] ${e}`);
    return { ok: false };
  }
}

export async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return false; // fail closed: no secret, no signing
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token || "");
  if (ip) form.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

function toBase64(bytes) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(s);
}
