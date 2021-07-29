const ejs = require("ejs");
const mongoose = require("mongoose");
const express = require ("express");


const workMin = 5;
const shortBreakMin = 5;
const longBreakMin = 15;
let reps = 0;
let endWork = 1;
let totalMin = 30;
let totalHours = 0;
let totalHoursMin = 30;
let timer = null;
let isPaused = false;
let totalTime = null;

const app = express();
const router = express.Router()


// ---------------------------- TIMER MECHANISM -------------------------------

function start(){
    let status = ""
    
    if (isPaused === true){
        isPaused = false
    }
    else{
        reps ++;
        endWork ++;
        let workSec = workMin * 60;
        let shortBreakSec = shortBreakMin * 60
        let longBreakSec = longBreakMin * 60
       

        if ( reps % 8 === 0){
            countDown(longBreakSec);
            status = "Long Break"
            return(status)
        }
        else if (reps % 2 === 0) {
            countDown(shortBreakSec);
            status = "Short Break"
        }
        else {
            countDown(workSec);
            status = "Work"
            
        };
    }
    
};


// ---------------------------- COUNTDOWN MECHANISM -----------------------------

function countDown(count){
   
    
    timer = setInterval(function(){
       
        if (!isPaused){
            count -= 1;
            let min = Math.floor(count / 60)
            let sec = count % 60
            if (sec < 10){
                sec = "0" + sec
            };
            let runningTime = min + ":" + sec;
            // console.log(runningTime)
            
            if (count === 0){
                // startButton.style.display = "inline-block";
                // pauseButton.style.display = "none";
               

                if ( reps % 8 === 0){
                    playSound('blue')
                    return runningTime;
                }
                else if (reps % 2 === 0){
                    playSound("green")
                    return runningTime;
                }
                else {
                    playSound("red")
                    
                    let workSession = Math.floor(endWork/2)
                    let marks = ""
                    
                    for (let i = 0; i < workSession; i ++){
                        marks += "🍅"
                        totalMin = 30 * workSession
                        totalHours = Math.floor(totalMin / 60)
                        totalHoursMin = totalMin % 60
                    }
                    if (totalHoursMin === 0) {
                        totalHoursMin = "00"
                    }
                    totalTime = totalHours + ":" + totalHoursMin
                    console.log(marks)                    
                    console.log("Total Time Working: " + totalTime) 
                    console.log("Total Minutes Working: " + totalMin)
                    console.log(totalMin)
                    return runningTime;
                    
                };
                
            clearInterval(timer);
          

            
            };  
        }
    }, 10);
    
};

// ---------------------------- PAUSE -----------------------------
function pause (){
    isPaused = true
    // startButton.style.display = "inline-block";
    // pauseButton.style.display = "none"; 
};

// ---------------------------- RESUME -----------------------------
function resume (){
    isPaused = false
};



// ---------------------------- RESET -----------------------------

function reset(){
    isPaused = false 
    clearInterval(timer);
    reps = 0
    endWork = 1
    marks = ""
    totalMin = 30
    totalHoursMin = 30

    // document.querySelector(".subTitle").innerText = "Timer";
    // document.getElementById("timer").innerText = "00:00";
    // startButton.style.display = "inline-block";
    // pauseButton.style.display = "none"; 

    // document.querySelector(".reps").innerText = ""
    // document.querySelector(".totalTime").innerText = "Total Time Working:"
    // document.querySelector(".totalMin").innerText = "Total Minutes Working:"

};

// ---------------------------- SOUND -----------------------------

function playSound(sound){
    // var audio = new Audio("/sounds/" + sound + ".mp3");
    // audio.play();
  };

module.exports = {
    start,
    countDown,
    pause,
    reset,
    playSound
}
// let port = process.env.PORT;
// if (port == null || port == ""){
//     port = 3000
// }

// app.listen(port, function(){
//     console.log("Server is running on port 3000")
// })