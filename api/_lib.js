const crypto = require("crypto");

// Vercel functions are stateless. Keep only non-sensitive config in memory;
// authentication is stored in an encrypted, HttpOnly cookie instead.
const configs = globalThis.__openutilityConfigs || (globalThis.__openutilityConfigs = new Map());

function secretKey() {
  const secret = process.env.SESSION_SECRET || process.env.DISCORD_CLIENT_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return crypto.createHash("sha256").update(secret).digest();
}

function cookieOptions() {
  return "Path=/; HttpOnly; Secure; SameSite=None; Max-Age=604800";
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(raw.split(";").filter(Boolean).map(part => {
    const i = part.indexOf("=");
    return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
  }));
}

function encryptSession(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(b => b.toString("base64url")).join(".");
}

function decryptSession(value) {
  try {
    const [ivRaw, tagRaw, encryptedRaw] = String(value || "").split(".");
    if (!ivRaw || !tagRaw || !encryptedRaw) return null;
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      secretKey(),
      Buffer.from(ivRaw, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    const clear = Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, "base64url")),
      decipher.final()
    ]).toString("utf8");
    return JSON.parse(clear);
  } catch {
    return null;
  }
}

function setSession(res, data) {
  const value = encryptSession({ ...data, createdAt: Date.now() });
  res.setHeader("Set-Cookie", `openutility_sid=${value}; ${cookieOptions()}`);
}

function getSession(req) {
  const id = parseCookies(req).openutility_sid;
  return id ? decryptSession(id) : null;
}

function clearSession(req, res) {
  res.setHeader("Set-Cookie", "openutility_sid=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0");
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "https://openutility2.github.io");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
}

function defaultConfig() {
  return {
    prefix: "!",
    commands: { slash: true, prefix: true },
    moderation: { enabled: true, antiSpam: false, antiLinks: false, warnings: true, timeoutMinutes: 10 },
    logging: { enabled: true, messageLogs: false, memberLogs: false, moderationLogs: true, commandLogs: true,
      messageChannelId: null, memberChannelId: null, moderationChannelId: null, commandChannelId: null },
    updatedAt: new Date().toISOString()
  };
}

function mergeConfig(existing) {
  const b = defaultConfig(), e = existing || {};
  return { ...b, ...e,
    commands: { ...b.commands, ...(e.commands || {}) },
    moderation: { ...b.moderation, ...(e.moderation || {}) },
    logging: { ...b.logging, ...(e.logging || {}) }
  };
}

async function discordFetch(url, options = {}) {
  const r = await fetch(url, options);
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!r.ok) { const e = new Error(data.message || `Discord API ${r.status}`); e.status = r.status; throw e; }
  return data;
}

function requireAuth(req, res) {
  const s = getSession(req);
  if (!s || !s.user || !s.accessToken) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return s;
}

function manageable(g) {
  const p = BigInt(g.permissions || "0");
  return g.owner || (p & 8n) === 8n || (p & 32n) === 32n;
}

module.exports = { configs, cookieOptions, parseCookies, setSession, getSession, clearSession, cors,
  defaultConfig, mergeConfig, discordFetch, requireAuth, manageable };
