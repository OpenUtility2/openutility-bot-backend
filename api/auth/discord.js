const crypto=require("crypto");
const {cors,states}=require("../_lib");
module.exports=(req,res)=>{
  cors(res); if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  if(!process.env.DISCORD_CLIENT_ID||!process.env.DISCORD_REDIRECT_URI)return res.status(500).send("Discord OAuth is not configured.");
  const state=crypto.randomBytes(24).toString("hex");
  states.set(state,Date.now());
  const q=new URLSearchParams({
    client_id:process.env.DISCORD_CLIENT_ID,response_type:"code",
    redirect_uri:process.env.DISCORD_REDIRECT_URI,scope:"identify guilds",state
  });
  res.redirect("https://discord.com/oauth2/authorize?"+q.toString());
};
