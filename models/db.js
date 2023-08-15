const mongoose = require('mongoose');
const option = {
    socketTimeoutMS: 30000,
    useNewUrlParser: true
};
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI, option).then(function(){
    //connected successfully
    console.log("MongoDB Connection succeeded.");
}, function(err) {
    //err handle
    console.log('Error in MongoDB Connection : ' +JSON.stringify(err,undefined,2));
});

require('./user.model');
require('./tweet.model');
require('./follow.model');