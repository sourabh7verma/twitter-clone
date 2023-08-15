const mongoose = require('mongoose');
require('mongoose-long')(mongoose);
var Schema = mongoose.Schema.Types,
ObjectId = Schema.ObjectId;
var FollowSchema = new mongoose.Schema({
    user_id:{
        type:ObjectId,
        trim:true,
        required:"User Id can\'t be empty",
    },
    follower_id:{
        type:ObjectId,
        trim:true,
        required:"Follower user Id can\'t be empty",
    },
    is_deleted:{
        type:Number,
        default:0,
        min:0,
        max:1
    },
    deletedAt:{
        type:Date,
        default:null
    },
    modified_by:{
        type:ObjectId,
        trim:true
    }
},{timestamps:true});

FollowSchema.index({user_id:1});
FollowSchema.index({follower_id:1});

FollowSchema.set('toJSON', { getters: true });
mongoose.model('Follow', FollowSchema);