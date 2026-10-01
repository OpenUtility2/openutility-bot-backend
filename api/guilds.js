const {cors,requireAuth,discordFetch,manageable}=require("./_lib");
module.exports=async(req,res)=>{
  cors(res);if(req.method==="OPTIONS")return res.status(204).end();
  const s=requireAuth(req,res);if(!s)return;
  try{
    const gs=await discordFetch("https://discord.com/api/v10/users/@me/guilds",{headers:{Authorization:`Bearer ${s.accessToken}`}});
    let out=gs.filter(manageable).map(g=>({...g,botInstalled:false,botMemberCount:null,botOnlineCount:null}));

    if(process.env.DISCORD_BOT_TOKEN){
      // Discord's bot account guild list is the authoritative membership check.
      // Do not infer bot installation from GET /guilds/:id: a bot token can query
      // guild information without that proving the bot is actually a member.
      try{
        const botGuilds=await discordFetch("https://discord.com/api/v10/users/@me/guilds",{
          headers:{Authorization:`Bot ${process.env.DISCORD_BOT_TOKEN}`}
        });
        const botGuildIds=new Set(botGuilds.map(g=>g.id));

        out=await Promise.all(out.map(async g=>{
          if(!botGuildIds.has(g.id)) return g;
          try{
            const bg=await discordFetch(`https://discord.com/api/v10/guilds/${g.id}?with_counts=true`,{
              headers:{Authorization:`Bot ${process.env.DISCORD_BOT_TOKEN}`}
            });
            return {
              ...g,
              botInstalled:true,
              memberCount:bg.approximate_member_count??bg.member_count??null,
              onlineCount:bg.approximate_presence_count??null
            };
          }catch{
            return {...g,botInstalled:true};
          }
        }));
      }catch(e){
        console.error("Unable to read bot guild membership:",e);
      }
    }

    res.json({guilds:out});
  }catch(e){res.status(e.status===401?401:502).json({error:"Unable to load Discord servers."});}
};
