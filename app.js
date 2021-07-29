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


mongoose.connect("mongodb://localhost:27017/pomoUserDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
mongoose.set("useCreateIndex", true);


const pomodoroSchema = new mongoose.Schema({
    email: String,
    password: String,
    session: [{
        date: String,
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
        res.render("index", {
            loggedIn: true, 
            indexPage: true,
            loginPage: false,
            registerPage: false
        })
    }
    else {
        res.render("index", {
            loggedIn: false, 
            indexPage: true,
            loginPage: false,
            registerPage: false
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
            indexPage: false
        })
    }
    else {
        res.render("login", {
            login: false, 
            loginPage: true,
            registerPage: false,
            indexPage: false
        })
    }
});

app.get("/register", function(req, res){
    if (req.isAuthenticated()){
        res.render("register", {
            loggedIn: true, 
            registerPage: true,
            loginPage: false,
            indexPage: false
        })
    }
    else {
        res.render("register", {
            login: false,  
            registerPage: true,
            loginPage: false,
            indexPage: false
        })
    }
});





app.post("/register", function(req, res){
    Pomodoro.register({username:req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err)
        }
        else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/")
            })
        }
    });

})

app.post("/", function(req, res){
   let time = req.body.time
   let date = new Date()
   let level = 0
   date = (date.getMonth() + 1) +"-" + date.getDate() + "-" + date.getFullYear()
  
   if (req.isAuthenticated()) {
    //    finds the user that is currently logged in
    Pomodoro.findById(req.user._id, function(err, foundUser){
        if (err){
            consoloe.log(err)
        }
        else {
            console.log(foundUser)
        // if this is the users first time loging a session it creates it
            if (foundUser){
                
                let lastElementPosition = foundUser.session.length - 1;
                let targetSession = foundUser.session[lastElementPosition]
                
                if (foundUser.session.length === 0){
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
                        case time <= 240:
                            level = 4;
                            break;
                        case time <= 300:
                            level = 5;
                            break;
                    }
                    let newSession = {date: date, timeTotal: time, level: level};
                    console.log("new session: " + date, time, level)
                    foundUser.session.push(newSession)
                    
                    foundUser.save(function(){
                        res.redirect("/")
                    })
                }

                // if user has already logged a session for the day this will update it if the logged another one
                else if (targetSession.date === date ){
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
                        case newTime <= 240:
                            level = 4;
                            break;
                        case newTime <= 300:
                            level = 5;
                            break;
                    }
                    updatedSession = {date: date, timeTotal: newTime, level: level}
                    console.log("updated session: " + date, time, level)
                    Pomodoro.findOneAndUpdate(
                        {_id: foundUser._id}, {$pull: {session: {_id: targetSession._id}}}, function(err, results){
                            if (err){
                                console.log(err)
                            }
                            else {
                                foundUser.session.push(updatedSession)
                                foundUser.save(function(){
                                    res.redirect("/")
                                }) 
                                
                            }
                        })
                    
                }
                // if this is the users first time logging a session for the day it adds it to the list
                else {
                    let newSession = {date: date, timeTotal: time};
                    foundUser.session.push(newSession)
                    foundUser.save(function(){
                        res.redirect("/")
                    }) 
                }
                
            }
        }
    })
   }
   else {
       res.redirect("/")
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
    console.log("Server is running on port 3000")
})