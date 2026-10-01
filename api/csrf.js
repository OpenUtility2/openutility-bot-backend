const {cors,getSession}=require("./_lib");
module.exports=(req,res)=>{cors(res);if(req.method==="OPTIONS")return res.status(204).end();if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});const s=getSession(req);if(!s)return res.status(401).json({error:"Not authenticated"});res.json({token:s.csrfToken});};
