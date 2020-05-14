//Allows express
const express = require('express')
const app = express();

//Allows socket.io
const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server);

//Allows cross-origin communication
const cors = require('cors')
app.use(cors())

const port = 8080;

const prompts = require('./prompts');
const database = require('./database');
var userModel = require('./user.js')

server.listen(port, function(){
  console.log("Listening on port " + port)
})

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
})

var players = [];
var promptsUsed = [];
var playersSubmitted = [];
var matchups = [];
var matchupsSent = [];
var timer;
var timerStartTime;

io.on('connection', (socket) => {
  //When someone creates the game, reset variables and broadcast the game creation to everyone
  socket.on('game creating', () => {
    players = ['gamer', 'cool', 'other']; //placeholder for multiple users, change this eventually to []
    promptsUsed = [];
    playersSubmitted = [];
    socket.emit('game created');
  });
  //Whenever a user joins the game, add them unless they're already in
  socket.on('user joining', function(username){
    if(!players.includes(username)){
      players.push(username);
      socket.emit('user joined', players);
    }else{
      socket.emit('duplicate username', username);
    }
  });
  //When someone starts the game, broadcast the game start to everyone and create the matchups
  socket.on('game starting', () => {
    socket.emit('game started');
    createNewRound(socket);
  });
  //When someone submits their prompts, adds to the appropriate prompts in matchups
  socket.on('user submitted', function(submissionInfo){
     
      playersSubmitted.push(submissionInfo.username);

      if(matchups[submissionInfo.prompt1index].player1 == submissionInfo.username){
        matchups[submissionInfo.prompt1index].player1answer = submissionInfo.prompt1answer;
      }else if(matchups[submissionInfo.prompt1index].player2 == submissionInfo.username){
        matchups[submissionInfo.prompt1index].player2answer = submissionInfo.prompt1answer;
      }else{
        console.log('error matching username to players: prompt 1');
      }

      if(matchups[submissionInfo.prompt2index].player1 == submissionInfo.username){
        matchups[submissionInfo.prompt2index].player1answer = submissionInfo.prompt2answer;
      }else if(matchups[submissionInfo.prompt2index].player2 == submissionInfo.username){
        matchups[submissionInfo.prompt2index].player2answer = submissionInfo.prompt2answer;
      }else{
        console.log('error matching username to players: prompt 2');
      }

    //If everyone has now submitted, start voting  
    if (playersSubmitted.length == players.length){
      clearInterval(timer);
      socket.emit('voting started');
      matchupsSent = [];
      newDuel();
    }
  });
  //TODO next: socket.on vote submitted; handle vote, if all votes submitted check if matchupsSent.length < matchups.length, if true newDuel again otherwise move to next round
});

//New timer with length in seconds that runs broadcasts the time left each second and runs funcWhenDone when time reaches 0
function newTimer(socket, length, funcWhenDone){
  timerStartTime = new Date();
  timer = setInterval(() => {
    if (timeLeft > 0){
      timeLeft = length - Math.floor((new Date() - timerStartTime) / 1000); //Expresses the time between now and the start time in seconds, rounding down since the function doesn't run on perfect 1000ms intervals
      socket.emit('timer', timeLeft);
    }else{
      clearInterval(timer);
      funcWhenDone();
    }
  }, 1000); //Runs the above function every 1000ms until clearInterval() is called
}

function createNewRound(socket){
  matchups = [];
  //Makes an array of all players in a random order to then match them up against each other
  var matchupIndex = [];
  while (matchupIndex.length < players.length){
    let i = Math.floor(Math.random() * players.length);
    if (!matchupIndex.includes(players[i])){
      matchupIndex.push(players[i]);
    }
  }
  //Creates matchups based on randomized index (pairs 1 with 2, 2 with 3, etc and then last one with 1)
  for (var i = 0; i < matchupIndex.length - 1; i++) {
    let prompt = prompts.getRandom(promptsUsed); //Each matchup gets a random prompt from prompts.js that hasn't already been chosen this round
    matchups.push({
      player1: matchupIndex[i],
      player2: matchupIndex[i + 1],
      player1answer: null,
      player2answer: null,
      prompt: prompt
    });
    promptsUsed.push(prompt);
  }
  let prompt = prompts.getRandom(promptsUsed);
  matchups.push({
    player1: matchupIndex[matchupIndex.length - 1],
    player2: matchupIndex[0],
    player1answer: null,
    player2answer: null,
    prompt: prompt
  });
  promptsUsed.push(prompt);
  //Sets matchup info to be broadcast once matchup creation is complete
  matchupInfo = {
    matchupIndex: matchupIndex,
    matchups: matchups
  };
  //Broadcasts matchup info for users to submit their prompts, starts a 90 second timer for submission
  socket.emit('round started', matchupInfo);
  newTimer(socket, 90, createNewDuel());
}

//Creates and broadcasts a new duel for users to vote on
function createNewDuel(){
  console.log('placeholder');
}

//TODO: when user logs in, check against database to see if there's a valid account with those credentials.

//Saves new accounts to the database
app.post('/createaccount', function(req,res,next){
    let user = new UserModel({
      username: req.body.username,
      password: req.body.password
    })
    user.save()
})

module.exports = app;