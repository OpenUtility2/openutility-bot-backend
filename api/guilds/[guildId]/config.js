const {cors,requireAuth,requireGuildAccess,configs,mergeConfig}=require("../../_lib");
module.exports=async(req,res)=>{
  cors(res);if(req.method==="OPTIONS")return res.status(204).end();
  const s=requireAuth(req,res);if(!s)return;
  const id=String(req.query.guildId||"");
  if(!id)return res.status(400).json({error:"Guild ID is required."});
  try{await requireGuildAccess(s,id);}catch(e){return res.status(e.status||502).json({error:e.status===403?e.message:"Unable to verify server permissions."});}
  if(req.method==="GET")return res.json({guildId:id,config:mergeConfig(configs.get(id))});
  if(req.method!=="PUT")return res.status(405).json({error:"Method not allowed"});
  const body=req.body||{};
  if(typeof body!=="object"||Array.isArray(body))return res.status(400).json({error:"Invalid configuration."});
  const cur=mergeConfig(configs.get(id));
  const next=mergeConfig({...cur,...body,commands:{...cur.commands,...(body.commands||{})},moderation:{...cur.moderation,...(body.moderation||{})},logging:{...cur.logging,...(body.logging||{})},updatedAt:new Date().toISOString()});
  if(typeof next.prefix!=="string"||next.prefix.length<1||next.prefix.length>5)return res.status(400).json({error:"Prefix must be 1-5 characters."});
  configs.set(id,next);
  res.json({ok:true,guildId:id,config:next});
};
