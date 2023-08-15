require('./config/config');
require('./models/db');
require('./config/passportConfig');
//const sendSMS = require('./config/sendSMS');
const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');
const passport = require('passport');

var app = express();
const rtsIndex = require('./routes/index.router');

app.use(express.static(__dirname+'/public'));
//middelware
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());
app.use(cors());
app.use('/api',rtsIndex);
app.use(passport.initialize());
//error handler
app.use((err, req, res, next) => {
    if(err.name === 'ValidationError')
    {
        var valErrors=[];
        Object.keys(err.errors).forEach(key =>valErrors.push(err.errors[key].message));
        //res.status(422).send(valErrors);
        res.status(200).json({status:false,message:valErrors[0]});
    }
});

app.listen(process.env.PORT,()=>console.log(`Server started at port:${process.env.PORT}`));