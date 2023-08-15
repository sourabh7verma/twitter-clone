const mongoose = require('mongoose');
require('mongoose-long')(mongoose);
var Schema = mongoose.Schema.Types,
    ObjectId = Schema.ObjectId;
var TweetSchema = new mongoose.Schema({
    title: {
        type:String,
        required:"Tweet title can\'t be empty",
        trim : true
    },
    description: {
        type:String,
        trim : true
    },
    created_by:{
        type:ObjectId,
        trim:true
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

TweetSchema.index({ title: 1,is_deleted: 1,deletedAt:1}, { unique: true });
TweetSchema.set('toJSON', { getters: true });
mongoose.model('Tweet', TweetSchema);