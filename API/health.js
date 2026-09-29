const {cors}=require("./_lib");
module.exports=(req,res)=>{cors(res);if(req.method==="OPTIONS")return res.status(204).end();res.status(200).json({status:"ok",name:"OpenUtility Bot API",time:new Date().toISOString()});};
