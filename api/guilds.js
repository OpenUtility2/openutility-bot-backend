const {cors,requireAuth,discordFetch,manageable}=require("./_lib");
module.exports=async(req,res)=>{
  cors(res);if(req.method==="OPTIONS")return res.status(204).end();
  const s=requireAuth(req,res);if(!s)return;
  try{
    const gs=await discordFetch("https://discord.com/api/v10/users/@me/guilds",{headers:{Authorization:`Bearer ${s.accessToken}`}});
    const manageableGuilds=gs.filter(manageable);
    let out=manageableGuilds.map(g=>({...g,botInstalled:false,botMemberCount:null,botOnlineCount:null}));
    if(process.env.DISCORD_BOT_TOKEN){
      out=await Promise.all(out.map(async g=>{
        try{
          const bg=await discordFetch(`https://discord.com/api/v10/guilds/${g.id}?with_counts=true`,{headers:{Authorization:`Bot ${process.env.DISCORD_BOT_TOKEN}`}});
          return {...g,botInstalled:true,memberCount:bg.approximate_member_count??bg.member_count??g.memberCount??null,onlineCount:bg.approximate_presence_count??g.onlineCount??null};
        }catch(e){
          return {...g,botInstalled:false,botMemberCount:null,botOnlineCount:null};
        }
      }));
    }
    res.json({guilds:out});
  }catch(e){res.status(e.status===401?401:502).json({error:"Unable to load Discord servers."});}
};
