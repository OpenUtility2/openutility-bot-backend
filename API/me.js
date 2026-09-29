const {cors,requireAuth}=require("./_lib");
module.exports=(req,res)=>{cors(res);if(req.method==="OPTIONS")return res.status(204).end();const s=requireAuth(req,res);if(!s)return;res.json({user:s.user});};
