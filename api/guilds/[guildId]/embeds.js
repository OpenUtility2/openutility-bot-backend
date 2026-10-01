const {cors,requireAuth,requireGuildAccess,discordFetch,dbGet,dbSet,embedKey,validGuildId}=require("../../_lib");
function cleanEmbed(input={}){
  const e={};
  if(input.title)e.title=String(input.title).slice(0,256);
  if(input.description)e.description=String(input.description).slice(0,4096);
  if(input.url)e.url=String(input.url).slice(0,2048);
  if(input.color!==undefined){const n=Number(input.color);if(Number.isInteger(n)&&n>=0&&n<=16777215)e.color=n;}
  if(input.footer?.text)e.footer={text:String(input.footer.text).slice(0,2048)};
  if(input.author?.name)e.author={name:String(input.author.name).slice(0,256)};
  if(Array.isArray(input.fields))e.fields=input.fields.slice(0,25).map(f=>({name:String(f.name||"Field").slice(0,256),value:String(f.value||" ").slice(0,1024),inline:!!f.inline}));
  if(input.thumbnail?.url)e.thumbnail={url:String(input.thumbnail.url).slice(0,2048)};
  if(input.image?.url)e.image={url:String(input.image.url).slice(0,2048)};
  return e;
}
module.exports=async(req,res)=>{
  cors(res);if(req.method==="OPTIONS")return res.status(204).end();
  const s=requireAuth(req,res);if(!s)return;
  const id=String(req.query.guildId||"");if(!validGuildId(id))return res.status(400).json({error:"Invalid guild ID."});
  try{await requireGuildAccess(s,id);}catch(e){return res.status(e.status||502).json({error:e.status===403?e.message:"Unable to verify server permissions."});}
  try{
    const key=embedKey(id), saved=(await dbGet(key))||[];
    if(req.method==="GET")return res.json({embeds:saved});
    if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
    const b=req.body||{}, embed=cleanEmbed(b.embed||b), action=b.action||"save";
    if(!embed.title&&!embed.description&&!embed.fields?.length)return res.status(400).json({error:"Embed needs content."});
    if(action==="send"){
      if(!process.env.DISCORD_BOT_TOKEN)return res.status(503).json({error:"Bot token is not configured."});
      const channelId=String(b.channelId||"");if(!/^\d{17,20}$/.test(channelId))return res.status(400).json({error:"A valid channel ID is required."});
      await discordFetch(`https://discord.com/api/v10/channels/${channelId}/messages`,{method:"POST",headers:{Authorization:`Bot ${process.env.DISCORD_BOT_TOKEN},Content-Type":"application/json"},body:JSON.stringify({embeds:[embed]})});
      return res.json({ok:true,sent:true});
    }
    const idValue=String(b.id||Date.now());const next=[...saved.filter(x=>x.id!==idValue),{id:idValue,name:String(b.name||embed.title||"Untitled").slice(0,80),embed,updatedAt:new Date().toISOString()}].slice(-50);
    await dbSet(key,next);res.json({ok:true,embed:next[next.length-1],embeds:next});
  }catch(e){console.error(e);res.status(e.status||503).json({error:e.message||"Embed operation failed."});}
};
