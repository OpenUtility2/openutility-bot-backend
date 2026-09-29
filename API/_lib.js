const crypto = require("crypto");

const sessions = globalThis.__openutilitySessions || (globalThis.__openutilitySessions = new Map());
const states = globalThis.__openutilityOAuthStates || (globalThis.__openutilityOAuthStates = new Map());
const configs = globalThis.__openutilityConfigs || (globalThis.__openutilityConfigs = new Map());

function cookieOptions() {
  return "Path=/; HttpOnly; Secure; SameSite=None; Max-Age=604800";
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(raw.split(";").filter(Boolean).map(part => {
    const i=part.indexOf("=");
    return [part.slice(0,i).trim(), decodeURIComponent(part.slice(i+1).trim())];
  }));
}

function setSession(res, data) {
  const id=crypto.randomBytes(32).toString("hex");
  sessions.set(id, data);
  res.setHeader("Set-Cookie", `openutility_sid=${id}; ${cookieOptions()}`);
  return id;
}

function getSession(req) {
  const id=parseCookies(req).openutility_sid;
  return id ? sessions.get(id) : null;
}

function clearSession(req,res) {
  const id=parseCookies(req).openutility_sid;
  if(id) sessions.delete(id);
  res.setHeader("Set-Cookie","openutility_sid=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0");
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "https://openutility2.github.io");
  res.setHeader("Access-Control-Allow-Credentials","true");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,PUT,OPTIONS");
}

function defaultConfig() {
  return {
    prefix:"!",
    commands:{slash:true,prefix:true},
    moderation:{enabled:true,antiSpam:false,antiLinks:false,warnings:true,timeoutMinutes:10},
    logging:{enabled:true,messageLogs:false,memberLogs:false,moderationLogs:true,commandLogs:true,
      messageChannelId:null,memberChannelId:null,moderationChannelId:null,commandChannelId:null},
    updatedAt:new Date().toISOString()
  };
}

function mergeConfig(existing) {
  const b=defaultConfig(), e=existing||{};
  return {...b,...e,
    commands:{...b.commands,...(e.commands||{})},
    moderation:{...b.moderation,...(e.moderation||{})},
    logging:{...b.logging,...(e.logging||{})}};
}

async function discordFetch(url, options={}) {
  const r=await fetch(url,options);
  const text=await r.text();
  let data={};
  try{data=text?JSON.parse(text):{}}catch{data={raw:text}};
  if(!r.ok){const e=new Error(data.message||`Discord API ${r.status}`);e.status=r.status;throw e;}
  return data;
}

function requireAuth(req,res) {
  const s=getSession(req);
  if(!s){res.status(401).json({error:"Not authenticated"});return null;}
  return s;
}

function manageable(g) {
  const p=BigInt(g.permissions||"0");
  return g.owner || (p&8n)===8n || (p&32n)===32n;
}

module.exports={sessions,states,configs,cookieOptions,parseCookies,setSession,getSession,clearSession,cors,defaultConfig,mergeConfig,discordFetch,requireAuth,manageable};
