//Allows express
const express = require('express')
const app = express();

//Allows server to read more complex bodies in post requests (needed to read objects)
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

//Allows socket.io
const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server);

//Allows cross-origin communication
const cors = require('cors')
app.use(cors())

//App for CRUD requests
app.listen(8000, function(){
  console.log("App listening on port " + 8000)
})

//Server for sockets
server.listen(8080, function(){
  console.log("Server listening on port " + 8080)
})

const prompts = require('./prompts');
const database = require('./database');
const UserModel = require('./user.js');

var gameGathering = false;
var gameRunning = false;
var clientCanVote = false;
var currentClientPage = 'lobby';
var storedPrompt1Answers = [];

var players = [];
var playerPoints = [];
var promptsUsed = [];
var playersSubmitted = [];
var matchups = [];
var matchupIndex = [];
var voteIndex = [];
var playersVoted = [];
var currentMatchup; //int
var timer; //object
var timerStartTime; //date

io.on('connection', (socket) => {
  //When someone creates the game, reset variables and broadcast the game creation to everyone
  socket.on('game creating', () => {
    players = ['gamer', 'cool', 'other']; //TODO: placeholder for multiple users, change this eventually to []
    playerPoints = [];
    promptsUsed = [];
    playersSubmitted = [];
    voteIndex = [];
    storedPrompt1Answers = [];
    gameGathering = true;
    socket.emit('game created');
  });
  //When someone starts the game, broadcast the game start to everyone and create the matchups
  socket.on('game starting', () => {
    for (var i in players) {
      playerPoints.push(0); //Sets the length of playerPoints = length of players
      addLifetimeGames(players[i]); //Adds 1 lifetime game to all players
    }
    gameGathering = false;
    gameRunning = true;
    socket.emit('game started');
    createNewRound(socket);
  });
});

//Randomizes matchups and broadcasts those matchups to begin the round
function createNewRound(socket){
  matchups = [];
  //Makes an array of all players in a random order to then match them up against each other
  matchupIndex = [];
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
      player1answer: '*no answer given*',
      player2answer: '*no answer given*',
      prompt: prompt,
      player1votes: 0,
      player2votes: 0
    });
    promptsUsed.push(prompt);
  }
  let prompt = prompts.getRandom(promptsUsed);
  matchups.push({
    player1: matchupIndex[matchupIndex.length - 1],
    player2: matchupIndex[0],
    player1answer: '*no answer given*',
    player2answer: '*no answer given*',
    prompt: prompt,
    player1votes: 0,
    player2votes: 0
  });
  promptsUsed.push(prompt);
  //Sets matchup info to be broadcast once matchup creation is complete
  matchupInfo = {
    matchupIndex: matchupIndex,
    matchups: matchups
  };
  //Broadcasts matchup info for users to submit their prompts, starts a 90 second timer for submission
  currentClientPage = 'submitprompts';
  socket.emit('round started', matchupInfo);
  newTimer(90, handleSubmitComplete);
}

//Runs when everyone has submitted or when the submission timer runs out
function handleSubmitComplete(){
  clearInterval(timer);
  currentClientPage = ('timeup');
  io.emit('get ready to vote')
  //Wait 5 seconds between end of submitting and start of voting
  setTimeout(() => { 
    io.emit('voting started');
    voteIndex = [];
    //Randomizes the order of prompts to vote on
    while (voteIndex.length < matchups.length){
      let i = Math.floor(Math.random() * matchups.length);
      if (!voteIndex.includes(matchups[i])){
        voteIndex.push(matchups[i]);
      }
    }
    currentClientPage = ('voting');
    currentMatchup = -1; //Starts at -1 because createNewDuel does currentMatchup++ at the beginning
    createNewDuel();
  }, 5000);
}

//Creates and broadcasts a new duel for users to vote on
function createNewDuel(){
  currentMatchup++;
  clientCanVote = true;
  io.emit('new duel', matchups[currentMatchup]);
  newTimer(20, showVoteResults);
}

//When voting is finished, save the results, broadcast them for 7 seconds, then go to the next round
function showVoteResults(){
  clearInterval(timer);
  clientCanVote = false;
  //Broadcasts votes
  let votes = [];
  votes.push(matchups[currentMatchup].player1 + ' (' + matchups[currentMatchup].player1answer + '): ' + matchups[currentMatchup].player1votes.toString());
  votes.push(matchups[currentMatchup].player2 + ' (' + matchups[currentMatchup].player2answer + '): ' + matchups[currentMatchup].player2votes.toString());
  io.emit('show votes', votes);
  //Saves results in playerPoints to show in leaderboard at the end
  for (var i in players) {
    if(matchups[currentMatchup].player1 === players[i]){
      playerPoints[i] += matchups[currentMatchup].player1votes;
    }
    if(matchups[currentMatchup].player2 === players[i]){
      playerPoints[i] += matchups[currentMatchup].player2votes;
    }
  }
  //Saves lifetime points in the database
  addLifetimePoints(matchups[currentMatchup].player1, matchups[currentMatchup].player1votes);
  addLifetimePoints(matchups[currentMatchup].player2, matchups[currentMatchup].player2votes);
  //Waits 7 seconds before moving onto the next round
  setTimeout(() => { 
    if (currentMatchup === matchups.length - 1){
      endRound();
    }else{
      createNewDuel();
    }
  }, 7000);
}

//Runs when all prompts have been voted on
function endRound(){
  //Creates orderedPointsArray, which is playerPoints (with corresponding player name) in descending order
  let orderedPointsArray = playerPoints;
  for(var i in playerPoints){
    playerPoints[i] = [players[i], playerPoints[i]];
  }
  orderedPointsArray = playerPoints.sort(function(a, b){
    return b[1] - a[1];
  });
  currentClientPage = ('lobby');
  gameRunning = false;
  io.emit('round complete', {
    pointsArray: orderedPointsArray
  });
}

//New timer with length in seconds that broadcasts the time left each second and runs funcWhenDone when time reaches 0
function newTimer(length, funcWhenDone){
  clearInterval(timer);
  timerStartTime = new Date();
  timer = setInterval(() => {
    timeLeft = length - Math.floor((new Date() - timerStartTime) / 1000); //Expresses the time between now and the start time in seconds, rounding down since the function doesn't run on perfect 1000ms intervals
    if (timeLeft > 0){
      io.emit('timer', timeLeft);
    }else{
      clearInterval(timer);
      funcWhenDone();
    }
  }, 1000); //Runs the above function every 1000ms until clearInterval() is called
}

//Adds +1 lifetime games to a given player
function addLifetimeGames(username){
  UserModel.findOneAndUpdate(
    { 
      "username" : username 
    },
    { 
      $inc: { "games" : 1 } 
    },
    {
      new: true,                    
      runValidators: true              
    })
  .catch(err => {
    console.error(err)
  })
}

//Adds a given number of lifetime points to a given player
function addLifetimePoints(username, points){
  UserModel.findOneAndUpdate(
    { 
      "username" : username 
    },
    { 
      $inc: { "points" : points } 
    },
    {
      new: true,                    
      runValidators: true              
    })
  .catch(err => {
    console.error(err)
  })
}

//Checks user credentials against database to login
app.post('/login', function(req,res,next){
    //Checks database to see if username exists
    let usernameExists = false;
    let userIndex = null;
    UserModel.find({})
    .then(doc => {
      for (var i = 0; i < doc.length; i++){
        if (doc[i].username === req.body.username){
          usernameExists = true;
          userIndex = i;
        }
      }
      //If username exists, check if password is correct; otherwise return error
      if (usernameExists){
        if (doc[userIndex].password === req.body.password){
          res.send({status: 'successful'})
        }else{
          res.send({status: 'incorrect password'})
        }
      }else{
        res.send({status: 'username not found'})
      }
    })
    .catch(err => {
      console.error(err)
    })
})

//Saves new accounts to the database
app.post('/createaccount', function(req,res,next){
    //Checks database to see if username already exists
    let usernameExists = false;
     UserModel.find({})
    .then(doc => {
      for (var i = 0; i < doc.length; i++){
        if (doc[i].username === req.body.username){
          usernameExists = true;
        }
      }
    })
    .catch(err => {
      console.error(err)
    })
    //If username doesn't exist, create account; otherwise return error
    if (!usernameExists){
      let user = new UserModel({
        username: req.body.username,
        password: req.body.password,
        points: 0,
        games: 0
      })
      user.save()
      res.send({status: 'successful'})
    }else{
      res.send({status: 'username already exists'})
    }
})

//When a user joins the game, add them unless they're already in, and broadcast the new player to everyone
app.post('/joingame', function(req,res,next){
  if(!players.includes(req.body.username)){
    players.push(req.body.username);
    io.emit('user joined', players);
    res.send({status: 'successful'});
  }else{
    res.send({status: 'duplicate'});
  }
})

//When someone submits their prompts, adds to the appropriate prompts in matchups
app.post('/submitprompts', function(req,res,next){
      
      if(!playersSubmitted.includes(req.body.username)){
        
        playersSubmitted = ['gamer', 'cool', 'other']; //TODO: Delete this in the final build, this just adds the dummy players
        playersSubmitted.push(req.body.username);

        if(matchups[req.body.prompt1index].player1 == req.body.username){
          matchups[req.body.prompt1index].player1answer = req.body.prompt1answer;
        }else if(matchups[req.body.prompt1index].player2 == req.body.username){
          matchups[req.body.prompt1index].player2answer = req.body.prompt1answer;
        }else{
          console.log('error matching username to players: prompt 1');
        }

        if(matchups[req.body.prompt2index].player1 == req.body.username){
          matchups[req.body.prompt2index].player1answer = req.body.prompt2answer;
        }else if(matchups[req.body.prompt2index].player2 == req.body.username){
          matchups[req.body.prompt2index].player2answer = req.body.prompt2answer;
        }else{
          console.log('error matching username to players: prompt 2');
        }
      
      //If everyone has now submitted, start voting   
      if (playersSubmitted.length === players.length){
       handleSubmitComplete();
      }
    }
})

//When someone votes, records the vote and calls showVoteResults if everyone has voted
app.post('/vote', function(req,res,next){
  playersVoted = ['gamer', 'cool', 'other']; //TODO: Change this to [], this just adds the dummy players
  if(!playersVoted.includes(req.body.username)){
    playersVoted.push(req.body.username);
    if (req.body.player == 1){
      matchups[currentMatchup].player1votes++;
    }
    if (req.body.player == 2){
      matchups[currentMatchup].player2votes++;
    }
    if (playersVoted.length >= players.length - 2){
      clearInterval(timer);
      playersVoted = ['gamer', 'cool', 'other']; //TODO: Change this to [], this just adds the dummy players
      showVoteResults();
    }
  }
})

app.post('/storeprompt1answer', function(req,res,next){
  storedPrompt1Answers.push({
    username: req.body.username,
    answer: req.body.answer
  });
})

app.get('/stateinfo', function(req,res,next){
  let currentMatchupLocal = null;
  if(matchups.length > 0 && currentMatchup){
    currentMatchupLocal = matchups[currentMatchup]
  }
  res.send({
    gameGathering: gameGathering,
    gameRunning: gameRunning,
    matchupIndex: matchupIndex,
    matchups: matchups,
    currentMatchup: currentMatchupLocal,
    playersSubmitted: playersSubmitted,
    playersVoted: playersVoted,
    canVote: clientCanVote,
    storedPrompt1Answers: storedPrompt1Answers,
    players: players,
    currentPage: currentClientPage
  });
})

app.get('/leaderboard', function(req,res,next){
  let leaderboardArray = [];
  UserModel.find({})
  .then(doc => {
    for (var i = 0; i < doc.length; i++){
      leaderboardArray.push({
        username: doc[i].username, 
        points: doc[i].points,
        games: doc[i].games
      })
    }
    let sortedLeaderboardArray = leaderboardArray.sort(function(a, b){
      return (b.points / b.games) - (a.points / a.games)
    });
    res.send({leaderboard: sortedLeaderboardArray});
  })
  .catch(err => {
    console.error(err)
  })
})

module.exports = app;