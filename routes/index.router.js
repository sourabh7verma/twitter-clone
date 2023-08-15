const express = require('express');
var _ = require('lodash');
const router = express.Router();
const ctrlUser = require('../controllers/user.controller');
const jwtHelper = require('../config/jwtHelper');
const ctrlTweet = require('../controllers/tweet.controller');
const ctrlFollow = require('../controllers/follow.controller');

//User routes
router.post('/register',ctrlUser.register);
router.post('/setpassword',ctrlUser.setpassword); // Use for set forgot password
router.post('/authenticate',ctrlUser.authenticate);
router.post('/logout',jwtHelper.verifyJwtToken,ctrlUser.logout);

//Tweet Routes
router.post('/create_tweet',jwtHelper.verifyJwtToken,ctrlTweet.createTweet);
router.get('/get_tweet',jwtHelper.verifyJwtToken,ctrlTweet.getTweet);
router.get('/getTweets',jwtHelper.verifyJwtToken,ctrlTweet.getTweets);
router.delete('/delete_tweet/:tweet_id',jwtHelper.verifyJwtToken,ctrlTweet.deleteTweet);

//Follow-Unfollow Users Routes
router.post('/follow_user',jwtHelper.verifyJwtToken,ctrlFollow.followUser);


module.exports = router;
