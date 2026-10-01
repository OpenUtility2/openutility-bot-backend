const {cors,requireAuth,requireGuildAccess,discordFetch,validGuildId}=require("../../_lib");
module.exports=async(req,res)=>{
  cors(res);if(req.method==="OPTIONS")return res.status(204).end();
  const s=requireAuth(req,res);if(!s)return;
  const id=String(req.query.guildId||"");if(!validGuildId(id))return res.status(400).json({error:"Invalid guild ID."});
  try{await requireGuildAccess(s,id);}catch(e){return res.status(e.status||502).json({error:e.status===403?e.message:"Unable to verify server permissions."});}
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  if(!process.env.DISCORD_BOT_TOKEN)return res.status(503).json({error:"Bot token is not configured."});
  const {action,userId,reason,minutes}=req.body||{};
  if(!/^\d{17,20}$/.test(String(userId||"")))return res.status(400).json({error:"A valid Discord user ID is required."});
  const headers={Authorization:`Bot ${process.env.DISCORD_BOT_TOKEN}`,"Content-Type":"application/json"};
  try{
    let result={ok:true,action};
    const r=String(reason||"OpenUtility Dashboard").slice(0,512);
    if(action==="ban")await discordFetch(`https://discord.com/api/v10/guilds/${id}/bans/${userId}`,{method:"PUT",headers,body:JSON.stringify({delete_message_seconds:0,reason:r})});
    else if(action==="unban")await discordFetch(`https://discord.com/api/v10/guilds/${id}/bans/${userId}`,{method:"DELETE",headers,body:JSON.stringify({reason:r})});
    else if(action==="kick")await discordFetch(`https://discord.com/api/v10/guilds/${id}/members/${userId}`,{method:"DELETE",headers,body:JSON.stringify({reason:r})});
    else if(action==="timeout"){const m=Math.max(1,Math.min(40320,Number(minutes)||10));const until=new Date(Date.now()+m*60000).toISOString();await discordFetch(`https://discord.com/api/v10/guilds/${id}/members/${userId}`,{method:"PATCH",headers,body:JSON.stringify({communication_disabled_until:until})});result.minutes=m;}
    else if(action==="untimeout")await discordFetch(`https://discord.com/api/v10/guilds/${id}/members/${userId}`,{method:"PATCH",headers,body:JSON.stringify({communication_disabled_until:null})});
    else return res.status(400).json({error:"Unsupported moderation action."});
    res.json(result);
  }catch(e){res.status(e.status||502).json({error:e.message||"Discord moderation action failed."});}
};
