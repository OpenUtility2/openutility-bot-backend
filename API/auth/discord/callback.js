const {cors,states,discordFetch,setSession}=require("../../_lib");
module.exports=async(req,res)=>{
  cors(res); if(req.method==="OPTIONS")return res.status(204).end();
  const {code,state,error}=req.query||{};
  const front=process.env.FRONTEND_URL||"https://openutility2.github.io";
  if(error)return res.redirect(`${front}/?auth=error`);
  if(!code||!state||!states.has(state))return res.status(400).send("Invalid or expired OAuth state.");
  states.delete(state);
  try{
    const body=new URLSearchParams({
      client_id:process.env.DISCORD_CLIENT_ID,
      client_secret:process.env.DISCORD_CLIENT_SECRET,
      grant_type:"authorization_code",code,redirect_uri:process.env.DISCORD_REDIRECT_URI
    });
    const token=await discordFetch("https://discord.com/api/v10/oauth2/token",{
      method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body
    });
    const user=await discordFetch("https://discord.com/api/v10/users/@me",{
      headers:{Authorization:`Bearer ${token.access_token}`}
    });
    setSession(res,{user:{id:user.id,username:user.username,global_name:user.global_name||user.username,avatar:user.avatar||null},accessToken:token.access_token});
    res.redirect(`${front}/?auth=success`);
  }catch(e){console.error("OAuth callback:",e);res.redirect(`${front}/?auth=error`);}
};
