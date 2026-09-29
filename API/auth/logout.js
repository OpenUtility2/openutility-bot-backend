const {cors,clearSession}=require("../../_lib");
module.exports=(req,res)=>{cors(res);if(req.method==="OPTIONS")return res.status(204).end();clearSession(req,res);res.json({ok:true});};
