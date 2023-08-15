const mongoose= require('mongoose');
const passport = require('passport');
const rn = require('random-number');
const  gen = rn.generator({
    min:  10000,
    max:  100000,
    integer: true
  })
 
const _ = require('lodash');
const User = mongoose.model('User');

const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

const regex = /^[A-Za-z0-9- ,_.']+$/;
const onlyIntegers= /^(?=.*?[1-9])[0-9()-]+$/;


/**
 * Method - POST
 * Used to register users into the system
 * Created By - @Sourabh Verma  08/15/2023
 * Request Params - first_name, last_name, email, password, confirm_password
 */
module.exports.register = (req,res,next)=>{
    console.log("Inside register fn. on UserController.js");
    if(req.body.email=='')
    {
        return res.status(200).json({status:false,message:'Email Id can\'t be empty.'});
    }
    else if(!req.body.email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/))
    {
        return res.status(200).json({status:false,message:'You have entered an invalid email address.'});
    }
    else if(req.body.first_name == undefined ||  req.body.first_name=='')
    {
        return res.status(200).json({status:false,message:'Please provide first name.'});
    }
    else if(req.body.last_name == undefined ||  req.body.last_name=='')
    {
        return res.status(200).json({status:false,message:'Please provide last name.'});
    }
    else if(req.body.password != req.body.confirm_password)
    {
        return res.status(200).json({status:false,message:'Password and Confirm password does not match.'});
    }
    else
    {   
        var user = new User();       
        user.first_name=req.body.first_name;
        user.last_name= req.body.last_name;
        var email =req.body.email;
        user.email = email.toLowerCase();
        user.isverified=false;
        user.password= req.body.password;
        user.setPassword = true;
        
        if(typeof req.body.device_type != 'undefined' || req.body.device_type !='')
        {
            user.device_type= req.body.device_type;
        }
        else
        {
            user.device_type= "";
        }

        user.save().then(function (saveduser) {
            var jwt_token = saveduser.generateJWT();
            pushJwtToken(saveduser._id,jwt_token);
            return res.status(200).json({status:true,http_status:201,token:jwt_token,message:'You are registered successfully!'});
        })
        .catch(function (err) {
            if(err.code == 11000)
            {
                if(err.errmsg.includes('phoneno'))
                {
                    return res.status(200).json({status:false,message:'Mobile no. already exists.'});
                }
                else
                {
                    return res.status(200).json({status:false,message:'Email id already exists.'});
                }
            }
        });
   }
}

module.exports.setpassword=(req,res,next)=>{
    console.log("Inside setpassword fn. on UserController.js");
    if(req.body.password == req.body.confirm_password)
    {
        if(req.body.user_id)
        {
            User.findOne({is_deleted:0,_id:req.body.user_id}, function(err, user){
                if(err)
                {
                    return res.status(200).json({status:false,message:'Some Internal server error occurred.'});
                }
                else
                {
                    if(user)
                    {
                        user.password= req.body.password;
                        user.setPassword = true;
                        user.change_password= 1;
                        user.jwt_tokens= [];
                        user.save(function(err){
                            if(!err)
                            {
                                var jwt_token = user.generateJWT();
                                pushJwtToken(user._id,jwt_token);
                                res.status(200).json({status:true,message:'Password set successfully.',token:jwt_token});
                            }
                            else
                            {
                                return next(err);
                            }
                        });
                    }
                    else
                    {
                        return res.status(200).json({status:false,message:'User record not found.'});
                    }
                }
            });  

        }
        else
        {
            return res.status(200).json({status:false,message:'User id Can\'t be empty.'});
        }

    }
    else
    {
        return res.status(200).json({status:false,message:'Confirm password do not match.'});
    }
}

/**
 * Method - POST
 * Used to authenticate/login users into the system
 * Created By - @Sourabh Verma  08/15/2023
 * Request Params - email, password
 */
module.exports.authenticate= (req,res,next)=>{
    console.log("Inside authenticate fn. on UserController.js");
    //call for passport authenticat
    passport.authenticate('local',(err,user,info)=>{
        //error from passport middelware
        if(err)
        {
            return res.status(200).json({status:false,message:err.message});
        }
        else if(user) 
        {
            var jwt_token = user.generateJWT();
            pushJwtToken(user._id,jwt_token);
            user.device_type="";
            if(typeof req.body.device_type != 'undefined' || req.body.device_type !='')
            {
                user.device_type= req.body.device_type;
            }

            if(user.change_password == 1)
            {
                user.change_password= 0;
            }
            
            user.save().then(function(result){
                return res.status(200).json({status:true,user:_.pick(user,['_id','first_name','last_name','email','type','isverified','phoneno']),message:'You are logged-in successfully.',token:jwt_token});
            }).
            catch(function(err){
                return res.status(200).json({status:false,message:err}); 
            });
        }
        else 
        {
            return res.status(200).json({status:false,message:info.message});
        }
    })(req,res);
}

module.exports.getProfile =(req,res,next)=>{
    console.log("Inside get userProfile fn. on UserController.js");
    User.findOne({_id:req._id,is_deleted:0},(err,user)=>{
        if(err)
        {
            return res.status(200).json({status:false,message:'Some Internal server error occurred.'});
        }
        else
        {
            if(!user) 
            {
                return res.status(200).json({status:false,message:'User record not found.'});
            }
            else 
            {
                return res.status(200).json({status:true,user:_.pick(user,['_id','first_name','last_name','email','type','country_detail','country_code','phoneno','profile_pic'])});
            }
        } 
    });
}

module.exports.updateProfile =(req,res,next)=>{
    console.log("Inside updateProfile fn. on UserController.js");
    if(!regex.test(req.body.first_name) || onlyIntegers.test(req.body.first_name))
    {
        return res.status(200).json({status:false,message:'Please enter valid First Name'});  
    }
    else if(!regex.test(req.body.last_name) || onlyIntegers.test(req.body.last_name))
    {
        return res.status(200).json({status:false,message:'Please enter valid Last Name'});  
    }
    else
    {
        User.findOne({is_deleted:0,_id:req._id}, function(err, user){
            if(err)
            {
                return res.status(200).json({status:false,message:'Some Internal server error occurred.'}); 
            }
            else
            {
                if(user)
                {
                    if(user.phoneno==req.body.phoneno)
                    {
                        //var email = req.body.email;
                    // email= email.toLowerCase();
                        //user.email=email;
                        user.first_name=capitalize(req.body.first_name);
                        user.last_name= capitalize(req.body.last_name);
                        if(req.body.password)
                        { 
                            //if(req.body.password !=req.body.confirm_password)
                            if(!user.verifyPassword(req.body.old_password))
                            {
                                return res.status(200).json({status:false,message:'Old password do not match.'});
                            }
                            else
                            {
                                user.password= req.body.password;
                                user.setPassword = true;
                                user.change_password= 1;
                                user.jwt_tokens= [];
                            }
                        }
                        else
                        {
                            user.setPassword = false;
                        }
                        
                        if(req.file)
                        {
                            var url = '/uploads/'+req.file.filename;
                            user.profile_pic = url;
                        }
                        user.country_code= req.body.country_code;
                        user.phoneno= req.body.phoneno;
                        user.country_detail=req.body.country_detail;
                        user.save(function(err,updateduser){
                            if(!err)
                            {
                                if(updateduser.change_password==1)
                                {
                                    Fcmtoken.deleteMany({user_id:updateduser._id},(err,token)=>{});
                                }
                                return res.status(200).json({status:true,user:_.pick(updateduser,['_id','first_name','last_name','email','type','country_detail','country_code','phoneno','profile_pic']),profile_pic:updateduser.profile_pic,message:'User profile update successfully.'});
                            }
                            else
                            {
                                if(err.code == 11000)
                                {
                                    
                                    if(err.errmsg.includes('phoneno'))
                                    {
                                        return res.status(200).json({status:false,message:'Phone no. already exists.'});
                                    }
                                    else
                                    {
                                        return res.status(200).json({status:false,message:'Email id already exists.'});
                                    }
                                }
                                else
                                {
                                    return next(err);
                                }
                            }
                        });

                    }
                    else
                    {
                        User.findOne({is_deleted:0,phoneno:req.body.phoneno},(err,doc)=>{
                            if(err)
                            {
                                return res.status(200).json({status:false,message:'Some Internal server error occurred.'});
                            }
                            else
                            {
                                if(doc)
                                {
                                    return res.status(200).json({status:false,message:'Phone number already exists.'});
                                }
                                else
                                {
                                    //var email = req.body.email;
                                    //email= email.toLowerCase();
                                    //user.email=email;
                                    user.first_name=capitalize(req.body.first_name);
                                    user.last_name= capitalize(req.body.last_name);
                                    if(req.body.password)
                                    { 
                                        //if(req.body.password !=req.body.confirm_password)
                                        if(!user.verifyPassword(req.body.old_password))
                                        {
                                            return res.status(200).json({status:false,message:'Old password do not match.'});
                                        }
                                        else
                                        {
                                            user.password= req.body.password;
                                            user.setPassword = true;
                                            user.change_password= 1;
                                            user.jwt_tokens= [];
                                        }
                                    }
                                    else
                                    {
                                        user.setPassword = false;
                                    }
                                    
                                    if(req.file)
                                    {
                                        var url = '/uploads/'+req.file.filename;
                                        user.profile_pic = url;
                                    }
                                    user.country_code= req.body.country_code;
                                    user.phoneno= req.body.phoneno;
                                    user.country_detail=req.body.country_detail;
                                    user.save(function(err,updateduser){
                                        if(!err)
                                        {
                                            if(updateduser.change_password==1)
                                            {
                                                Fcmtoken.deleteMany({user_id:updateduser._id},(err,token)=>{});
                                            }
                                            return res.status(200).json({status:true,user:_.pick(updateduser,['_id','first_name','last_name','email','type','country_detail','country_code','phoneno','profile_pic']),profile_pic:updateduser.profile_pic,message:'User profile update successfully.'});
                                        }
                                        else
                                        {
                                            if(err.code == 11000)
                                            {
                                                
                                                if(err.errmsg.includes('phoneno'))
                                                {
                                                    return res.status(200).json({status:false,message:'Phone no. already exists.'});
                                                }
                                                else
                                                {
                                                    return res.status(200).json({status:false,message:'Email id already exists.'});
                                                }
                                            }
                                            else
                                            {
                                                return next(err);
                                            }
                                        }
                                    });

                                }
                            }
                        });

                    }
                    
                }
                else
                {
                    return res.status(200).json({status:false,message:'User record not found.'});
                }
            }
        });  
    }    
}

module.exports.forgotPassword=(req,res,next)=>{
    console.log("Inside forgotPassword fn. on UserController.js");
    if(req.body.email)
    {
        var email = req.body.email;
        email= email.toLowerCase();
        User.findOne({is_deleted:0,email:email}, function(err, user){
            if(err)
            {
                return res.status(200).json({status:false,message:'Some Internal server error occurred.'});
            }
            else
            {
                if(user)
                {
                    if(req.body.link)
                    {
                        var PasswordLink = req.body.link+user._id;
                    }
                    else
                    {
                        var PasswordLink=process.env.ForgotPasswordLink+user._id;
                    }
                   
                    var mailOptions = {
                                to: user.email,
                                subject: 'Forgot Password',
                                value: PasswordLink,
                                msg:"Your forgot password link is"
                            };
                    
                    mailsend.SendEmail(mailOptions);
                    res.status(200).json({status:true,message:'Please check your email.'});
                        
                }
                else
                {
                    return res.status(200).json({status:false,message:'User record not found.'});
                }
            }
        });  

    }
    else
    {
        return res.status(200).json({status:false,message:'Email Can\'t be empty.'});
    }
}

/**
 * Method - POST
 * Used to logout users from the system
 * Created By - @Sourabh Verma  08/15/2023
 * Request Params - jwt_token
 */
module.exports.logout= (req,res,next)=>{
    console.log("Inside logout fn. on UserController.js");
    if(typeof req.body.jwt_token == 'undefined' || req.body.jwt_token =='')
    {
        return res.status(200).json({status:false,message:"Jwt token can not be null."});
    }
    else
    {
        User.findOne({is_deleted:0,_id:req._id})
        .then(function(user){
            if(user)
            {
                User.updateOne({is_deleted:0,_id:req._id},{$pull:{"jwt_tokens": {token: req.body.jwt_token}}}).then(function(logout_user){
                    if(logout_user)
                    {
                        return res.status(200).json({status:true,message:'You are logged-out successfully.'});
                    }else{
                        return res.status(200).json({status:false,message:'Some Internal server error occurred.'});
                    }
                }).catch(function(err){
                    return res.status(200).json({status:false,message:err});
                });
            }
            else
            {
                return res.status(200).json({status:false,message:"User records not found."});
            }
        }).catch(function(err){
            return res.status(200).json({status:false,message:err});
        });
    }
}

module.exports.changePassword=(req,res,next)=>{
    console.log("Inside changePassword fn. on UserController.js");
    if(typeof req.body.password == 'undefined' || req.body.password =='')
    {
        return res.status(200).json({status:false,message:"Password can not be null."});
    }
    else  if(typeof req.body.confirm_password =='undefined' || req.body.confirm_password =='')
    {
        return res.status(200).json({status:false,message:"Confirm password can not be null."});
    }
    else  if(typeof req.body.old_password =='undefined' || req.body.old_password=='')
    {
        return res.status(200).json({status:false,message:"Old password  can not be null."});
    }
    else if(req.body.password == req.body.confirm_password)
    {
        if(req._id)
        {
            User.findOne({_id:req._id,is_deleted:0}, function(err, user){
                if(err)
                {
                    return res.status(200).json({status:false,message:'Some Internal server error occurred.'});
                }
                else
                {
                    if(user)
                    {
                        user.setPassword = false;
                        if(!user.verifyPassword(req.body.old_password))
                        {
                            return res.status(200).json({status:false,message:'Old password do not match.'});
                        }
                        else
                        {
                            user.password= req.body.password;
                            user.setPassword = true;
                            user.change_password= 1;
                            user.jwt_tokens= [];
                        }

                        user.save((err,updateUser)=>{
                            if(!err)
                            {
                                if(updateUser.change_password==1)
                                {
                                    Fcmtoken.deleteMany({user_id:updateUser._id},(err,token)=>{});
                                }
                                return res.status(200).json({status:true,message:'Password changed successfully.'});
                            }
                            else
                            {
                                return next(err);
                            }
                        });
                    }
                    else
                    {
                        return res.status(200).json({status:false,message:'User record not found.'});
                    }
                }
            });  

        }
        else
        {
            return res.status(200).json({status:false,message:'User id Can\'t be empty.'});
        }

    }
    else
    {
        return res.status(200).json({status:false,message:'Confirm password do not match.'});
    }
}

function pushJwtToken(id,token)
{
    User.updateOne({ _id : id },{ $push: { "jwt_tokens" : {token:token,expire:false} } }).then(function(res){

    }).catch(function (err) {
        if(err)
        {
            console.log(err);
            
        }
    });
}

function getLocalizationSetting(id,usertype,cb)
{
    if(usertype == 'siteuser')
    {
        Application.findOne({is_deleted:0,_id:id},{localization:1},(err,setting)=>{
            if(err)
            {

                cb(err,null);
            }
            else
            {
                if(setting.localization.length>0)
                {
                    var localization_setting={};
                    var value={};
                    localization_setting._id=setting.localization[0].id;
                    localization_setting.key="Localization_Setting";
                    localization_setting.setting_type="APP_SETTING";
                    value.timezone=setting.localization[0].timezone;
                    value.date_time=setting.localization[0].date_time;
                    value.language=setting.localization[0].language;
                    value.currency=setting.localization[0].currency;
                    value.currency_details=setting.localization[0].currency_details;
                    value.unit=setting.localization[0].unit;
                    localization_setting.value=String(JSON.stringify(value));
                    cb(null,localization_setting);
                }
                else
                {
                    Setting.findOne({is_deleted:0,key:'Localization_Setting',setting_type:'GLOBLE'},{key:1,value:1,setting_type:1},(err,setting)=>{
                        if(err)
                        {
                            cb(null,null);
                        }
                        else
                        {
                            if(setting)
                            {
                                cb(null,setting);
                            }
                            else
                            {
                                cb(null,null);
                            }
                        }
                
                    });
                }
            }
      
        });

    }
    else
    {
        Setting.findOne({is_deleted:0,key:'Localization_Setting',setting_type:'GLOBLE'},{key:1,value:1,setting_type:1},(err,setting)=>{
            if(err)
            {
                cb(null,null);
            }
            else
            {
                if(setting)
                {
                    cb(null,setting);
                }
                else
                {
                    cb(null,null);
                }
            }
    
        });

    }
    
}


