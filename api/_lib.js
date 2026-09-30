const crypto = require("crypto");

const configs = globalThis.__openutilityConfigs || (globalThis.__openutilityConfigs = new Map());

function secretKey() {
  const secret = process.env.SESSION_SECRET || process.env.DISCORD_CLIENT_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return crypto.createHash("sha256").update(secret).digest();
}
function cookieOptions() { return "Path=/; HttpOnly; Secure; SameSite=None; Max-Age=604800"; }
function parseCookies(req) {
  const raw=req.headers.cookie||"";
  return Object.fromEntries(raw.split(";").filter(Boolean).map(part=>{const i=part.indexOf("=");return [part.slice(0,i).trim(),decodeURIComponent(part.slice(i+1).trim())]}));
}
function encryptSession(data) {
  const iv=crypto.randomBytes(12), cipher=crypto.createCipheriv("aes-256-gcm",secretKey(),iv);
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(data),"utf8"),cipher.final()]);
  const tag=cipher.getAuthTag();
  return [iv,tag,encrypted].map(b=>b.toString("base64url")).join(".");
}
function decryptSession(value) {
  try {
    const [ivRaw,tagRaw,encryptedRaw]=String(value||"").split(".");
    if(!ivRaw||!tagRaw||!encryptedRaw)return null;
    const decipher=crypto.createDecipheriv("aes-256-gcm",secretKey(),Buffer.from(ivRaw,"base64url"));
    decipher.setAuthTag(Buffer.from(tagRaw,"base64url"));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(encryptedRaw,"base64url")),decipher.final()]).toString("utf8"));
  } catch { return null; }
}
function setSession(res,data){res.setHeader("Set-Cookie",`openutility_sid=${encryptSession({...data,createdAt:Date.now()})}; ${cookieOptions()}`);}
function getSession(req){const id=parseCookies(req).openutility_sid;return id?decryptSession(id):null;}
function clearSession(req,res){res.setHeader("Set-Cookie","openutility_sid=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0");}
function cors(res){res.setHeader("Access-Control-Allow-Origin",process.env.FRONTEND_URL||"https://openutility2.github.io");res.setHeader("Access-Control-Allow-Credentials","true");res.setHeader("Access-Control-Allow-Headers","Content-Type");res.setHeader("Access-Control-Allow-Methods","GET,POST,PUT,OPTIONS");}
function defaultConfig(){return {prefix:"!",commands:{slash:true,prefix:true},moderation:{enabled:true,antiSpam:false,antiLinks:false,warnings:true,timeoutMinutes:10},logging:{enabled:true,messageLogs:false,memberLogs:false,moderationLogs:true,commandLogs:true,messageChannelId:null,memberChannelId:null,moderationChannelId:null,commandChannelId:null},updatedAt:new Date().toISOString()};}
function mergeConfig(existing){const b=defaultConfig(),e=existing||{};return {...b,...e,commands:{...b.commands,...(e.commands||{})},moderation:{...b.moderation,...(e.moderation||{})},logging:{...b.logging,...(e.logging||{})}};}
async function discordFetch(url,options={}){const r=await fetch(url,options),text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={raw:text}}if(!r.ok){const e=new Error(data.message||`Discord API ${r.status}`);e.status=r.status;throw e;}return data;}
function requireAuth(req,res){const s=getSession(req);if(!s||!s.user||!s.accessToken){res.status(401).json({error:"Not authenticated"});return null;}return s;}
function manageable(g){const p=BigInt(g.permissions||"0");return !!g.owner||(p&8n)===8n||(p&32n)===32n;}
async function requireGuildAccess(session,guildId){
  const guilds=await discordFetch("https://discord.com/api/v10/users/@me/guilds",{headers:{Authorization:`Bearer ${session.accessToken}`}});
  const guild=guilds.find(g=>g.id===String(guildId));
  if(!guild||!manageable(guild)){const e=new Error("You do not have permission to manage this server.");e.status=403;throw e;}
  return guild;
}
module.exports={configs,cookieOptions,parseCookies,setSession,getSession,clearSession,cors,defaultConfig,mergeConfig,discordFetch,requireAuth,manageable,requireGuildAccess};
