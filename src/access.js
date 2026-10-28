// Checks the login token Cloudflare Access adds to every request that got through its login.
// Fails closed: if ACCESS_TEAM_DOMAIN or ACCESS_AUD are not set, nothing passes.

let keyCache = { at: 0, keys: [] };

export async function verifyAccessJwt(request, env) {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return false;

  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return false;
    const header = JSON.parse(text(b64urlToBytes(h)));
    const payload = JSON.parse(text(b64urlToBytes(p)));
    if (header.alg !== "RS256") return false;

    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const now = Date.now() / 1000;
    // ACCESS_AUD may list several Access apps, comma-separated (e.g. the workers.dev app and the hub app).
    const allowed = String(env.ACCESS_AUD).split(",").map((s) => s.trim()).filter(Boolean);
    if (!aud.some((a) => allowed.includes(a))) return false;
    if (payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return false;
    if (typeof payload.exp !== "number" || payload.exp < now) return false;
    if (typeof payload.nbf === "number" && payload.nbf > now + 60) return false;

    const jwk = await findKey(env, header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlToBytes(s),
      new TextEncoder().encode(`${h}.${p}`)
    );
  } catch {
    return false;
  }
}

async function findKey(env, kid) {
  const fresh = Date.now() - keyCache.at < 3600_000;
  let jwk = fresh && keyCache.keys.find((k) => k.kid === kid);
  if (jwk) return jwk;
  // Not cached (or the key rotated): fetch the current set, at most once a minute.
  if (Date.now() - keyCache.at < 60_000 && keyCache.keys.length) return null;
  const res = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
  if (!res.ok) return null;
  keyCache = { at: Date.now(), keys: (await res.json()).keys || [] };
  return keyCache.keys.find((k) => k.kid === kid) || null;
}

function b64urlToBytes(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "=");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function text(bytes) {
  return new TextDecoder().decode(bytes);
}

// For tests: forget the cached keys.
export function _resetKeyCache() {
  keyCache = { at: 0, keys: [] };
}
