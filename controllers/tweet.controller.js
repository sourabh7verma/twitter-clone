const mongoose= require('mongoose');
var ObjectId = require('mongodb').ObjectId;
const _ = require('lodash');
const User = mongoose.model('User');
const Tweet = mongoose.model('Tweet');
const Follow = mongoose.model('Follow');

/**
 * Method - POST
 * Used to createTweet
 * Created By - @Sourabh Verma  08/15/2023
 * Request Params - title, description
 */
module.exports.createTweet= (req,res,next)=>{
    console.log("Inside createTweet fn. on TweetController.js");
    if(typeof req.body.title == 'undefined' || req.body.title =='')
    {
        return res.status(200).json({status:false,message:"Tweet title can not be null."});
    }
    else
    {
        User.findOne({is_deleted:0,_id:req._id})
        .then(function(user){
            if(user)
            {
                var tweet = new Tweet();       
                tweet.title=req.body.title;
                tweet.description= req.body.description;
                tweet.created_by= req._id;

                tweet.save().then(function (tweet_saved) {
                    if(tweet_saved)
                    {
                        return res.status(200).json({status:true,http_status:201,message:'Tweet has been created successfully.'});
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

/**
 * Method - GET
 * Used to createTweet
 * Created By - @Sourabh Verma  08/15/2023
 * Request Query Params
 * if needs user specific tweets then pass ?user_id={user_id}
 * if search into tweets then pass ?search={search_value}
 */
module.exports.getTweet = (req,res,next)=>{
    console.log("Inside getTweet fn. on TweetController.js");

    const page= +req.query.page || 1;
    var ITMES_PER_PAGE = +req.query.per_page || 5;
    var totalItems;

    var query={is_deleted:0};
    if(req.query.search)
    {
        var q= req.query.search;
        query.title= {$regex: new RegExp(q,'i')};
    }

    var sort={};
    if(req.query.orderby && req.query.order)
    {
        var order_by=req.query.orderby;
        var order=req.query.order;
        sort[order_by]=Number(order);
    }
    
    if(Object.keys(sort).length === 0 && sort.constructor === Object)
    {
        sort._id=-1;
    }

    if(req.query.user_id){
        query.created_by= new ObjectId(req.query.user_id);
    }

    User.findOne({is_deleted:0,_id:req._id})
    .then(function(user){
        if(user)
        {

            Tweet.aggregate([
                { $match :query},
                {
                    $lookup:
                    {
                        from: "users",
                        localField: "created_by",
                        foreignField: "_id",
                        as: "users"
                    },
                },
            ]).exec().then(function(totalTweets){
                totalItems = totalTweets.length;
                Tweet.aggregate([
                    { $match :query},
                    {
                        $lookup:
                        {
                            from: "users",
                            localField: "created_by",
                            foreignField: "_id",
                            as: "users"
                        },
                    },
                    {$sort:sort},
                    {$skip : (page - 1) * ITMES_PER_PAGE},
                    {$limit : ITMES_PER_PAGE},
                    {
                        $project:{
                            "_id":1,
                            "title":1,
                            "description":1,
                            "created_by":1,
                            "first_name":{ $arrayElemAt: [ "$users.first_name", 0 ] },
                            "last_name":{ $arrayElemAt: [ "$users.last_name", 0 ] },
                            "createdAt":1,
                            "updatedAt":1
                        }
                    }  
                ]).exec().then(function(tweets){
                    if(tweets.length>0)
                    {  
                        return res.status(200).json({status:true,data:tweets,item_per_page:ITMES_PER_PAGE,totalTweets:totalItems,hasNextPage: ITMES_PER_PAGE * page < totalItems,hasPreviousPage:page>1,nextPage:page+1,previousPage:page-1,lastPage:Math.ceil(totalItems / ITMES_PER_PAGE)});
                    }
                    else
                    {
                        return res.status(200).json({status:false,message:"Record not found."});
                    }
                }).catch(function(err){
                    return res.status(200).json({status:false,message:'Some Internal server error occurred1.'});
                });
            }).catch(function(err){
                return res.status(200).json({status:false,message:'Some Internal server error occurred2.'});
            });
        }else
        {
            return res.status(200).json({status:false,message:"User records not found."});
        }
    }).catch(function(err){
        return res.status(200).json({status:false,message:err});
    });
}

/**
 * Method - DELETE
 * Used to deleteTweet
 * Created By - @Sourabh Verma  08/15/2023
 * Request Params - /tweet_id
 */
module.exports.deleteTweet= async (req,res,next)=>{
    console.log("Inside deleteTweet fn. on TweetController.js");
    if(typeof req.params.tweet_id == 'undefined' || req.params.tweet_id =='')
    {
        return res.status(200).json({status:false,message:"Please provide tweet ID."});
    }
    else
    {
        let user = await User.findOne({is_deleted:0,_id:req._id});
        if(user){
            const tweet_id = new ObjectId(req.params.tweet_id);
            let tweet = await Tweet.findOne({is_deleted:0,_id:tweet_id,created_by:req._id});
            if(tweet){
                Tweet.updateOne({_id:tweet_id},{$set:{"is_deleted": 1}}).then(function(updateTweets){
                    if(updateTweets)
                    {
                        return res.status(200).json({status:true,message:'Tweet deleted successfully'});
                    }else{
                        return res.status(200).json({status:false,message:'Some Internal server error occurred.'});
                    }
                }).catch(function(err){
                    return res.status(200).json({status:false,message:err});
                });
            }else{
                return res.status(200).json({status:false,message:"Tweet not found, Unable to delete.",other_user_tweet:true});
            }
        }
    }
}


/**
 * Method - GET
 * Get all self tweets and friends tweets
 * Created By - @Sourabh Verma  08/15/2023
 * Request Query Params
 * if search into tweets then pass ?search={search_value}
 */
module.exports.getTweets = async(req,res,next)=>{
    console.log("Inside getTweets fn. on TweetController.js");
    let query = {user_id:new ObjectId(req._id),is_deleted:0};

    //Get array of all myfriends 
    Follow.aggregate([
        { $match :query},
        {$project:{_id:0,follower_id:1}},
        {
        "$group": {
           "_id": null,
           "follower_id": { "$push": "$follower_id" }
        }
      },
      {$project:{_id:0,follower_id:1}}
    ]).exec().
    then(function(tweets){

        var friends_ids = [new ObjectId(req._id)];
        if(tweets.length > 0){
            friends_ids = [new ObjectId(req._id),...tweets[0].follower_id];
        }

        const page= +req.query.page || 1;
        var ITMES_PER_PAGE = +req.query.per_page || 5;
        var totalItems;

        var query={is_deleted:0};
        if(req.query.search)
        {
            var q= req.query.search;
            query.title= {$regex: new RegExp(q,'i')};
        }

        var sort={};
        if(req.query.orderby && req.query.order)
        {
            var order_by=req.query.orderby;
            var order=req.query.order;
            sort[order_by]=Number(order);
        }
        
        if(Object.keys(sort).length === 0 && sort.constructor === Object)
        {
            sort._id=-1;
        }

        if(req.query.user_id){
            query.created_by= new ObjectId(req.query.user_id);
        } 

        query.created_by={$in:friends_ids};
        Tweet.aggregate([
            { $match :query},
            {
                $lookup:
                {
                    from: "users",
                    localField: "created_by",
                    foreignField: "_id",
                    as: "users"
                },
            },
        ]).exec().then(function(totalTweets){
            totalItems = totalTweets.length;
            Tweet.aggregate([
                { $match :query},
                {
                    $lookup:
                    {
                        from: "users",
                        localField: "created_by",
                        foreignField: "_id",
                        as: "users"
                    },
                },
                {$sort:sort},
                {$skip : (page - 1) * ITMES_PER_PAGE},
                {$limit : ITMES_PER_PAGE},
                {
                    $project:{
                        "_id":1,
                        "title":1,
                        "description":1,
                        "created_by":1,
                        "first_name":{ $arrayElemAt: [ "$users.first_name", 0 ] },
                        "last_name":{ $arrayElemAt: [ "$users.last_name", 0 ] },
                        "createdAt":1,
                        "updatedAt":1
                    }
                }  
            ]).exec().then(function(tweets){
                if(tweets.length>0)
                {  
                    return res.status(200).json({status:true,data:tweets,item_per_page:ITMES_PER_PAGE,totalTweets:totalItems,hasNextPage: ITMES_PER_PAGE * page < totalItems,hasPreviousPage:page>1,nextPage:page+1,previousPage:page-1,lastPage:Math.ceil(totalItems / ITMES_PER_PAGE)});
                }
                else
                {
                    return res.status(200).json({status:false,message:"Record not found."});
                }
            }).catch(function(err){
                return res.status(200).json({status:false,message:'Some Internal server error occurred1.'});
            });
        }).catch(function(err){
            return res.status(200).json({status:false,message:'Some Internal server error occurred2.'});
        });
    });
}