const mongoose= require('mongoose');
var ObjectId = require('mongodb').ObjectId;
const _ = require('lodash');
const User = mongoose.model('User');
const Follow = mongoose.model('Follow');

/**
 * Method - POST
 * Used to follow a user
 * Created By - @Sourabh Verma  08/15/2023
 * Request Params - /follow_userid
 * When Unfollow - Need key - type:"unfollow"
 */
module.exports.followUser= async (req,res,next)=>{
    console.log("Inside followUser fn. on TweetController.js");
    if(typeof req.body.follow_userid == 'undefined' || req.body.follow_userid =='')
    {
        return res.status(200).json({status:false,message:"Please provide follow user ID."});
    }
    else
    {
        let user = await User.findOne({is_deleted:0,_id:req._id});  // Check user exists
        if(user){
            const follow_userid = new ObjectId(req.body.follow_userid);
            let followuser_records = await User.findOne({is_deleted:0,_id:follow_userid});  // Check if follow user exists or not
            if(followuser_records){

                let followuser_exists = await Follow.findOne({is_deleted:0,user_id:req._id,follower_id:follow_userid}); // Check if already followed by logged-in user

                if(!followuser_exists){

                    /* if user going to unfollow  user who is not friend */
                    if(req.body.type == "unfollow"){
                        return res.status(200).json({status:false,message:`Unable to unfollow, You and ${followuser_records.first_name} ${followuser_records.last_name} are no longer friends.`});
                    }
                    /* if user going to unfollow  user who is not friend */

                    //Go ahead to follow user

                    var followdata = new Follow();
                    followdata.user_id = req._id;
                    followdata.follower_id = follow_userid;
                    followdata.save().then(function(saved){
                        if(saved){
                            return res.status(200).json({status:true,message:`You have followed successfully.`});
                        }else{
                            return res.status(200).json({status:false,message:"Unable to follow."}); 
                        }
                    }).catch(function(err){
                        return res.status(200).json({status:false,message:`Unable to follow ${err}`});
                    });
                }else{

                    // if type is unfollow then proceed to unfollow user...
                    if(req.body.type == "unfollow"){

                        Follow.updateOne({is_deleted:0,user_id:req._id,follower_id:follow_userid},{$set:{"is_deleted":1}}).then(function(unfollow_user){
                            if(unfollow_user)
                            {
                                return res.status(200).json({status:true,message:'You have unfollowed successfully.'});
                            }else{
                                return res.status(200).json({status:false,message:'Some Internal server error occurred.'});
                            }
                        }).catch(function(err){
                            return res.status(200).json({status:false,message:err});
                        });
                    }else{

                        // if already followed then show message
                        return res.status(200).json({status:true,message:`You have already followed ${followuser_records.first_name} ${followuser_records.last_name}`});
                    }
                }
            }else{
                return res.status(200).json({status:false,message:"Unable to follow, Selected user does not exists."});
            }
        }else{
            return res.status(200).json({status:false,message:"User not found."});
        }
    }
}