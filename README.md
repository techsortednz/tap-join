# tap-join

Online sign-up and e-signing for new Tap Sign customers, at **jointap.techsorted.nz**.

You make a private sign-up link for a customer. They open it on their phone and do three things: check their details, read the agreement, then tick two boxes and type their full name to sign. The Worker stamps their details and signature onto the agreement PDF and stores it. It then emails the signed copy to them (BCC you) and pings the Tap Signs Telegram bot.

Under the Contract and Commercial Law Act 2017 (Part 4), an electronic signature is valid if it identifies the person and shows they meant to sign. Every signature records:
- the typed name and both tick boxes (agree, authorised to sign)
- the accounts email, date and time (NZ), IP address, country and browser
- the agreement version and a SHA-256 hash of the PDF

## Everyday use

1. Open **https://hub.techsorted.nz** (your private hub, one Cloudflare Access login for Stats and Agreements) and go to **Agreements**.
2. Fill in **New sign-up link**: business name, plus optional customer email, page slug, Xero quote number, number of signs and a private note. The slug, quote and number of signs appear on the agreement locked, so the customer can't change them.
3. Tick **Email the link to the customer now**, or copy the link and send it yourself. Links last 14 days (`INVITE_DAYS`) and work only once.
4. When they sign, you get a Telegram message and a BCC of their email. The signed PDF is under **Signed** on the Agreements page, with a **Resend copy** button if the email didn't go.
5. To cancel a link nobody has used yet, press **Cancel** on it.

The customer can download their signed copy from the same link for 30 days afterwards.

## Changing the agreement

The terms live in `agreement/terms.html`. The page layout is `agreement/agreement.html`, and the sign-up page shows the same `terms.html`.

1. Edit `agreement/terms.html` (or the layout), and bump `agreement/version.txt` (e.g. `1.1`).
2. Run `pip install weasyprint pypdf && python3 tools/build_agreement.py`. It fails if the agreement no longer fits on one page.
3. Run `npm test`, then look at `test/out/sample-signed.pdf`.
4. Commit `agreement/` and `assets/`, then merge to `main`.

Signed agreements keep the version they were signed on, because each one is stored as its own PDF.

## Files

| Path | What it is |
|---|---|
| `src/worker.js` | Routes, signing, hub home and Agreements |
| `src/pages.js` | Sign-up, signed, error, hub and Agreements pages |
| `src/emails.js` | The sign-up link email and the signed-copy email |
| `src/pdf.js` | Stamps details and signature onto the template (pdf-lib) |
| `src/validate.js` | Form field rules |
| `src/notify.js` | SMTP2GO email, Telegram, Turnstile check |
| `src/access.js` | Cloudflare Access login check (same as tap-stats) |
| `agreement/` | Agreement source (HTML, terms, version, fonts for building) |
| `assets/` | Built PDFs, field positions, fonts the Worker embeds |
| `migrations/` | D1 tables (`invites`, `agreements`) |
| `tools/build_agreement.py` | Rebuilds `assets/` from `agreement/` |

## Setup (once)

1. **D1:** `npx wrangler d1 create tap-join --location oc`, then put the `database_id` into `wrangler.toml`, then run `npx wrangler d1 migrations apply tap-join --remote`.
2. **R2:** create a bucket called `tap-agreements` with location hint Oceania. Keep it private, with no public access and no r2.dev URL.
3. **Worker:** connect this repo in Workers & Pages (Workers Builds, deploy `main`), the same as tap-stats.
4. **Custom domain:** in the Worker's Settings, go to Domains & Routes and add `jointap.techsorted.nz`.
5. **Turnstile:** either add `jointap.techsorted.nz` to the existing widget's hostnames or make a new widget. Put its site key in `TURNSTILE_SITEKEY` in `wrangler.toml`.
6. **Access:** the "techsorted hub" self-hosted Access app covers all of `hub.techsorted.nz` (same "Cloudflare account members" policy as tap-stats). Its AUD tag is `ACCESS_AUD` here and is also listed in tap-stats. `hub.techsorted.nz` has a proxied `AAAA 100::` DNS record so the Worker routes work: `hub.techsorted.nz/stats*` goes to tap-stats, everything else to this Worker.
7. **Secrets** (Worker, Settings, Variables and Secrets, type Secret):
   - `TURNSTILE_SECRET`
   - `SMTP2GO_API_KEY`: the same key the cafe forms use. `MAIL_FROM` must be on the verified `techsorted.nz` sender domain.
   - `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`: the Tap Signs bot and your chat.

Without `TURNSTILE_SECRET`, nobody can sign (it fails closed). Without SMTP2GO or Telegram, signing still works, and the Agreements page flags "Copy not emailed".

## Local testing

```
npm install
npm run db:local
printf 'DEV_ADMIN=yes\nDEV_SKIP_TURNSTILE=yes\nPUBLIC_ORIGIN=http://localhost:8787\n' > .dev.vars
npx wrangler dev
```

Then open http://localhost:8787/hub or http://localhost:8787/agreements (`npm run dev` keeps localhost as the host). `DEV_ADMIN` and `DEV_SKIP_TURNSTILE` only take effect on localhost. `.dev.vars` is git-ignored and never deployed.

## Security notes

- **Sign-up links:** 128-bit random codes, single use, they expire, and you can cancel them. Locked fields always come from the invite, never from the submitted form.
- **Double taps:** the invite is claimed in one conditional update before anything else, so a double tap can't sign twice. If storing fails, the claim is undone.
- **Forms:** every POST must come from the same origin (CSRF), and HTML output is escaped. A strict CSP allows only the Turnstile and Google Fonts hosts.
- **Admin:** behind Cloudflare Access, and the Worker also verifies the Access token itself and fails closed.
- **Storage:** signed PDFs sit in a private R2 bucket. They are served only through the hub, or to the customer's own link for 30 days. Nothing is committed to git.
- **Retention:** the agreement says signed agreements are kept for 7 years after the agreement ends.
