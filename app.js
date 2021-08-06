require("dotenv").config();
const ejs = require("ejs");
const mongoose = require("mongoose");
const express = require ("express");
const session = require("express-session");
const path = require("path");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const facbookStrategy = require("passport-facebook").Strategy;
const googleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const { body, validationResult } = require('express-validator');
const { allowedNodeEnvironmentFlags } = require("process");
const alert = require("alert");


const app = express();





app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.static( "public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://admin-ashanti:*CgUcK!L._xQ6w7M4BeT-3n*@cluster0.s42fm.mongodb.net/pomodoroDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
mongoose.set("useCreateIndex", true);


const pomodoroSchema = new mongoose.Schema({
    username: String,
    password: String,
    session: [{
        date: String,
        dayNumOfYear: Number,
        timeTotal: Number,
        level: Number
    }]
    

});

pomodoroSchema.plugin(passportLocalMongoose);
pomodoroSchema.plugin(findOrCreate);

const Pomodoro = new mongoose.model("Pomodoro", pomodoroSchema);

passport.use(Pomodoro.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    Pomodoro.findById(id, function(err, user) {
        done(err, user);
    });
});





app.get("/", function(req, res){
    if (req.isAuthenticated()){
        let userLevel = [];
        let userDay = [];
        let userTime = []
        let userData = req.user.session;
        let beginningOfYearDate = new Date(new Date().getFullYear(), 0, 1);
        let calenderDate = [beginningOfYearDate.toLocaleString().split(',')[0]];
        let fistDayOfYear = beginningOfYearDate.getDay()
       
        
        userData.forEach(function(session){
            let userLevelItem = session.level
            let userDayItem = session.dayNumOfYear
            let userTimeItem = session.timeTotal
            
            userLevel.push(userLevelItem)
            userDay.push(userDayItem)
            userTime.push(userTimeItem)
            
            beginningOfYearDate.setDate(beginningOfYearDate.getDate()+1)

            calenderDate.push(beginningOfYearDate.toLocaleString().split(',')[0]);
            
            
        })
        

        res.render("index", {
            user: req.user.username,
            loggedIn: true, 
            indexPage: true,
            loginPage: false,
            registerPage: false,
            levelData: userLevel,
            dayData: userDay,
            firstDay: fistDayOfYear,
            date: calenderDate,
            time:userTime,
           
            
        })
    }
    else {
        res.render("index", {
            loggedIn: false, 
            indexPage: true,
            loginPage: false,
            registerPage: false,
            levelData: "",
            dayData: "",
            firstDay: false,
            date: "",
            time:"",
            
        })
    }
    
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/")
})

app.get("/login", function(req, res){
    if (req.isAuthenticated()){
        res.render("login", {
            loggedIn: true, 
            loginPage: true,
            registerPage: false,
            indexPage: false,
            firstDay: false,
            
        })
    }
    else {
        res.render("login", {
            login: false, 
            loginPage: true,
            registerPage: false,
            indexPage: false,
            firstDay: false,
        })
    }
});

app.get("/register", function(req, res){
    if (req.isAuthenticated()){
        res.render("register", {
            loggedIn: true, 
            registerPage: true,
            loginPage: false,
            indexPage: false,
            firstDay: false,
        })
    }
    else {
        res.render("register", {
            login: false,  
            registerPage: true,
            loginPage: false,
            indexPage: false,
            firstDay: false,
        })
    }
});





app.post("/register", function(req, res){
    
    let now = new Date()
    let level = 0
    let date = (now.getMonth() + 1) +"-" + now.getDate() + "-" + now.getFullYear()
    // this gets the current number of the day out of 365 days
    let start = new Date(now.getFullYear(), 0, 0);
    let diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    var oneDay = 1000 * 60 * 60 * 24;
    let day = Math.floor(diff / oneDay);

    
    
    Pomodoro.register({username:req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err)
            alert("This user already exist.")
            res.redirect("register")
        }
        else {
            console.log("New user created")
            passport.authenticate("local")(req, res, function(){
                Pomodoro.findById(req.user._id, function(err, foundUser){
                    if (err){
                        consoloe.log(err)
                    }
                    else{
                        let lastElementPosition = foundUser.session.length - 1;
                        
                        if (foundUser.session.length === 0){
                            for (let i = 0; i < 366; i++){
                                if (i > 0) {
                                 
                                foundUser.session.push({level: 0, dayNumOfYear: i, timeTotal: 0})
                               
                                foundUser.save(function(){})
                                
                                }
                            }
                        }
                    }
                });
                res.redirect("/")
            })
        }
    });
    
})

app.post("/", function(req, res){
   
   let time = req.body.time
   let now = new Date()
    let level = 0
    let date = (now.getMonth() + 1) +"-" + now.getDate() + "-" + now.getFullYear()
    // this gets the current number of the day out of 365 days
    let start = new Date(now.getFullYear(), 0, 0);
    let diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    var oneDay = 1000 * 60 * 60 * 24;

    let day = Math.floor(diff / oneDay);
    console.log(date)

  
   if (req.isAuthenticated()) {
    //    finds the user that is currently logged in
    Pomodoro.findById(req.user._id, function(err, foundUser){
        if (err){
            consoloe.log(err)
        }
        else {
       
            // records the first submit of the day
            if (foundUser){
                
                let elementPosition = day - 1
                let targetSession = foundUser.session[elementPosition]
                 console.log(targetSession)

                if (targetSession.date === undefined){
                    console.log("new")

                    switch(true){
                        case time === 0:
                            level = 0;
                            break;
                        case time <= 60:
                            level = 1;
                            break;
                        case time <= 120:
                            level = 2;
                            break;
                        case time <= 180:
                            level = 3
                            break;
                        case time <= 240:
                            level = 4;
                            break;
                        case time <= 300:
                            level = 5;
                            break;
                        case time <= 360:
                            level = 6;
                            break;
                        case time > 360:
                            level = 7;
                            break;
                    }

                    Pomodoro.findOneAndUpdate(
                        {_id: foundUser._id, "session._id": targetSession._id}, 
                        {"$set": {
                            "session.$.date": date,
                            "session.$.dayNumOfYear": day,
                            "session.$.timeTotal": time,
                            "session.$.level": level,
                        }}, function(err, results){
                            if (err){
                                console.log(err)
                            }
                            else {
                                console.log(targetSession)
                                console.log(date)

                                res.redirect("/")
                                
                            };
                        });
                    
                }
                // updates the the current days record
                else {
                    console.log("update")
                    newTime = targetSession.timeTotal + parseInt(time);

                    switch(true){
                        case newTime === 0:
                            level = 0;
                            break;
                        case newTime <= 60:
                            level = 1;
                            break;
                        case newTime <= 120:
                            level = 2;
                            break;
                        case newTime <= 180:
                            level = 3
                            break;
                        case newTime <= 240:
                            level = 4;
                            break;
                        case newTime <= 300:
                            level = 5;
                            break;
                        case newTime <= 360:
                            level = 6;
                            break;
                        case newTime > 360:
                            level = 7;
                            break;
                    }
                    
                    Pomodoro.findOneAndUpdate(
                        {_id: foundUser._id, "session._id": targetSession._id}, 
                        {"$set": {
                            "session.$.date": date,
                            "session.$.dayNumOfYear": day,
                            "session.$.timeTotal": newTime,
                            "session.$.level": level,
                        }}, function(err, results){
                            if (err){
                                console.log(err)
                            }
                            else {
                                console.log(targetSession)
                                console.log(date)
                                res.redirect("/") 
                                
                            }
                        })
                   
                }
   
            }
        }
    })
   }
  
  

});

app.post("/login", function(req, res){
    const user = new Pomodoro({
        username: req.body.username,
        password: req.body.password,
    });

    req.login(user, function(err){
        if (err){
            console.log(err)
           
        }
        else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/")
            })
        }
    });
    
    
   
});








let port = process.env.PORT;
if (port == null || port == ""){
    port = 3000
}

app.listen(port, function(){
    console.log("Server has started succsessfully")
})