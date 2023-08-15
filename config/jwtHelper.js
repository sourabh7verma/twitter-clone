const jwt = require('jsonwebtoken');
require('./config');
require('../models/db');
const mongoose= require('mongoose');
const User = mongoose.model('User');
module.exports.verifyJwtToken = (req,res,next)=>{
    var token;
    if('authorization' in req.headers)
            token = req.headers['authorization'].split(' ')[1];
    if(!token)
        return res.status(200).send({status:false, message:"No token provided. "});
    else{
        jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
            if (err)
                return res.status(200).send({status:false, message:"Token authentication failed. "});
            else
            {
                if(decoded._id)
                { 
                    var check= process.env.CHECK_JWT_EXP;
                    if(check=='true')
                    {
                        User.findOne({_id:decoded._id,is_deleted:0,"jwt_tokens.token":token},{_id:1})
                        .then(function(user){
                            if(user)
                            {
                                req.user_type=decoded.user_type;
                                req.appID=decoded.appID;
                                req._id=decoded._id;
                                next();
                            }
                            else
                            {
                                return res.status(200).send({status:false, message:"Token has been expired.",sessionExpired:true});
                            }
                        }).catch(function(err){
                            return res.status(200).json({status:false,message:err});
                        });
                    }
                }
            }
        });
    }
}