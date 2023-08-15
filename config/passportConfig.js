const passport= require('passport');
const localStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('User');
passport.use(
    new localStrategy({usernameField:'email'},
    (username,password,done)=>{
        User.findOne({email:username.toLowerCase(),is_deleted:0}).
        then(function(user){

            //unkown user
            if(!user)
                return done(null,false,{message:'Email Id is not registered.'});
            //Password Not Set
            else if(!user.password)
                return done(null,false,{message:'Password not set.'});
            //Wrong Password
            else if(!user.verifyPassword(password))
                return done(null,false,{message:'Incorrect password entered.'});
            //Authentication Successfull
            else
            {
                return done(null,user);
            }
        }).catch(function (err) {
            return done(err);
        });
    })
);