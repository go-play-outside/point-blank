import React from "react";
import ReactDOM from 'react-dom';
import socketIOClient from "socket.io-client";
import Table from 'react-bootstrap/Table';

import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";

class App extends React.Component{

  constructor(props){
    super(props);
    this.state = {
      socket: socketIOClient('http://localhost:8080'),
      timeLeft: null,
      username: "",
      password: "",
      gameGathering: false,
      gameRunning: false,
      players: [],
      prompt1: null,
      prompt2: null,
      inputtedPromptAnswer: "",
      prompt1answer: null,
      prompt2answer: null,
      prompt1index: null,
      prompt2index: null,
      currentMatchup: null,
      canVote: false,
      hasVoted: false,
      votes: ['',''],
      leaderboardArray: null,
      endPointsArray: [],
      prevPage: 'login',
      currentPage: 'login'
    };
    this.getStateInfo = this.getStateInfo.bind(this);
    this.getLeaderboard = this.getLeaderboard.bind(this);
    this.showLeaderboard = this.showLeaderboard.bind(this);
    this.Login_handleUsernameChange = this.Login_handleUsernameChange.bind(this);
    this.Login_handlePasswordChange = this.Login_handlePasswordChange.bind(this);
    this.Login_handleLogin = this.Login_handleLogin.bind(this);
    this.CreateAccount_handleCreateAccount = this.CreateAccount_handleCreateAccount.bind(this);
    this.Lobby_createGame = this.Lobby_createGame.bind(this);
    this.Lobby_joinGame = this.Lobby_joinGame.bind(this);
    this.Lobby_startGame = this.Lobby_startGame.bind(this);
    this.Prompts_roundStart = this.Prompts_roundStart.bind(this);
    this.Prompts_handlePromptAnswerChange = this.Prompts_handlePromptAnswerChange.bind(this);
    this.Prompts_handleSubmission1 = this.Prompts_handleSubmission1.bind(this);
    this.Prompts_handleSubmission2 = this.Prompts_handleSubmission2.bind(this);
    this.Voting_handleVote = this.Voting_handleVote.bind(this);
  }

  //Gets all required info from server for user to catch up to current game state after reloading or crashing
  getStateInfo(){
    fetch('http://localhost:8000/stateinfo', {
      method: 'get',
      headers: {'Content-Type': 'application/json'},
    })
    .then(res => res.text())
    .then(res => JSON.parse(res))
    .then(res => {
      //Does all of this with local variables so there's only one clean state update at the end
      let prompt1 = null;
      let prompt2 = null;
      let prompt1answer = null;
      let prompt1index = null;
      let prompt2index = null;
      //This is all basically doing part of what Prompts_roundStart does to filter for which matchups the user is in
      if(res.matchupIndex.length > 0 && res.matchups.length > 0){
        let indexPosition = res.matchupIndex.indexOf(this.state.username);
        if (indexPosition === 0){
          prompt1 = res.matchups[0].prompt;
          prompt2 = res.matchups[res.matchups.length - 1].prompt;
          prompt1index = 0;
          prompt2index = res.matchups.length - 1;
        }else{
          prompt1 = res.matchups[indexPosition - 1].prompt;
          prompt2 = res.matchups[indexPosition].prompt;
          prompt1index = indexPosition - 1;
          prompt2index = indexPosition;
        }
        for (var i in res.storedPrompt1Answers) {
          if(res.storedPrompt1Answers[i].username === this.state.username){
            prompt1answer = res.storedPrompt1Answers[i].answer;
          }
        }
      }
      this.setState({
        gameGathering: res.gameGathering,
        gameRunning: res.gameRunning,
        prompt1: prompt1,
        prompt2: prompt2,
        prompt1answer: prompt1answer,
        prompt1index: prompt1index,
        prompt2index: prompt2index,
        currentMatchup: res.currentMatchup,
        canVote: res.canVote,
        hasVoted: res.playersVoted.includes(this.state.username),
        players: res.players,
        currentPage: res.currentPage
      });
    })
    .catch(err => err)
  }

  //Gets lifetime leaderboard info from server
  getLeaderboard(){
    fetch('http://localhost:8000/leaderboard', {
      method: 'get',
      headers: {'Content-Type': 'application/json'},
    })
    .then(res => res.text())
    .then(res => JSON.parse(res))
    .then(res => {
      this.setState({
        leaderboardArray: res.leaderboard
      });
    })
    .catch(err => err)
  }

  //Runs when "View Lifetime Leaderboard" button is clicked
  showLeaderboard(){
    this.getLeaderboard();
    let currentpage = this.state.currentPage;
    this.setState({
      prevPage: currentpage,
      currentPage: 'leaderboard'
    });
  }

  //Runs when user edits the username text box to login/create account
  Login_handleUsernameChange(event){
    this.setState({
      username: event.target.value
    });
  }

  //Runs when user edits the password text box to login/create account
  Login_handlePasswordChange(event){
    this.setState({
      password: event.target.value
    });
  }

  //Runs when user submits the form to login; if a username and password have been entered, send to the server to check for an existing account with those credentials
  Login_handleLogin(event){
    event.preventDefault();
    if (this.state.username && this.state.password){
      fetch('http://localhost:8000/login', {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
         username: this.state.username, 
         password: this.state.password,
        }),
      })
      .then(res => res.text())
      .then(res => JSON.parse(res))
      .then(res => {
        if(res.status === 'successful'){
          this.getStateInfo(); 
        }else if (res.status === 'username not found'){
          alert('User does not exist.')
        }else if (res.status === 'incorrect password'){
          alert('Incorrect password.')
        }else{
          alert('Unexpected error logging in.')
        }
      })
      .catch(err => err)
    }
  }

  //Runs when user submits the form to create an account; if a username and password have been entered, send to the server to create an account with those credentials
  CreateAccount_handleCreateAccount(event){
    event.preventDefault();
    if (this.state.username && this.state.password){
      fetch('http://localhost:8000/createaccount', {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
         username: this.state.username, 
         password: this.state.password,
        }),
      })
      .then(res => res.text())
      .then(res => JSON.parse(res))
      .then(res => {
        if(res.status === 'successful'){
          alert('Account created!')
          this.setState({
            currentPage: 'login'
          }) 
        }else if (res.status === 'username already exists'){
          alert('Username already exists.')
        }else{
          alert('Unexpected error creating account.')
        }
      })
      .catch(err => err)
    }
  }

  //Tells server to reset variables and broadcast a new game
  Lobby_createGame(){
    fetch('http://localhost:8000/creategame', {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
    })
    .then(() => {
      this.Lobby_joinGame();
    })
    .catch(err => err)
  }

  //Tells server to add user into the list of players and broadcast the new players list to all users
  Lobby_joinGame(){
    fetch('http://localhost:8000/joingame', {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
       username: this.state.username, 
      }),
    })
    .then(res => res.text())
    .then(res => JSON.parse(res))
    .then(res => {
      if(res.status === 'duplicate'){
        alert('Player with username ' + this.state.username + ' is already in the game.')
      }
    })
    .catch(err => err)
  }

  //Tells the server to start the game and begin the round
  Lobby_startGame(){
    if (this.state.players.length >= 3){
      fetch('http://localhost:8000/startgame', {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
      })
      .catch(err => err)
    }else{
      alert('The game needs at least 3 players.')
    }
  }

  //Takes matchup info from the server to find which prompts to answer, then sets currentPage to 'submitprompts'
  //This function is set up a little weirdly with the setTimeout and looping the function if indexPosition is -1 to solve issues where the state wasn't immediately updating so indexPosition would be -1 and the prompt setting wouldn't work properly, tried to use an event listener originally but that didn't work
  Prompts_roundStart(matchupInfo){
    setTimeout(() => { 
      let matchupIndex = matchupInfo.matchupIndex;
      let matchups = matchupInfo.matchups;
      let indexPosition = matchupIndex.indexOf(this.state.username); //Finds user's position in matchupIndex in order to assign them the appropriate prompts
      if(indexPosition >= 0){
        //Assigns user the appropriate prompts based on indexPosition, then navigates to submitprompts page
        if (indexPosition === 0){
          this.setState({
            prompt1: matchups[0].prompt,
            prompt2: matchups[matchups.length - 1].prompt,
            prompt1answer: null,
            prompt2answer: null,
            prompt1index: 0,
            prompt2index: matchups.length - 1,
            currentPage: 'submitprompts'
          });
        }else{
          this.setState({
            prompt1: matchups[indexPosition - 1].prompt,
            prompt2: matchups[indexPosition].prompt,
            prompt1answer: null,
            prompt2answer: null,
            prompt1index: indexPosition - 1,
            prompt2index: indexPosition,
            currentPage: 'submitprompts'
          });
        }
      }else{
        this.Prompts_roundStart(matchupInfo);
      }
    }, 100);
  }

  //Runs when user edits the submission text box for a prompt
  Prompts_handlePromptAnswerChange(event){
    this.setState({
      inputtedPromptAnswer: event.target.value
    });
  }

  //Runs when user submits the first prompt; sends the first prompt to the server (so user can get it back if they reload), then user moves onto prompt 2
  Prompts_handleSubmission1(event){
    event.preventDefault();
    if (this.state.inputtedPromptAnswer !== ""){ //Prevents accidentally clicking submit when prompt is empty
      let answer = this.state.inputtedPromptAnswer;
      this.setState({
        prompt1answer: answer,
        inputtedPromptAnswer: ""
      });
      fetch('http://localhost:8000/storeprompt1answer', {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
         username: this.state.username, 
         answer: answer
        }),
      })
    }
  }

  //Runs when user submits the second prompt; sends both prompt responses to the server to send out when voting happens
  Prompts_handleSubmission2(event){
    event.preventDefault();
    if (this.state.inputtedPromptAnswer !== ""){ //Prevents accidentally clicking submit when prompt is empty
      let answer = this.state.inputtedPromptAnswer;
      //If both prompts have now been submitted, broadcast submission to the server
      if(this.state.prompt1answer){
        fetch('http://localhost:8000/submitprompts', {
          method: 'post',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
             username: this.state.username,
             prompt1: this.state.prompt1,
             prompt2: this.state.prompt2,
             prompt1answer: this.state.prompt1answer,
             prompt2answer: answer,
             prompt1index: this.state.prompt1index,
             prompt2index: this.state.prompt2index
          }),
        })
        this.setState({
          prompt2answer: answer,
          inputtedPromptAnswer: ""
        });
      }
    }
  }

  //Posts user vote to the server
  Voting_handleVote(num){
    if(this.state.canVote && !this.state.hasVoted){
      fetch('http://localhost:8000/vote', {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
           username: this.state.username,
           player: num
        }),
      })
      this.setState({
        hasVoted: true
      });
    }
  }

  render(){
    switch (this.state.currentPage){ //Using currentPage on one file rather than something like react-router so I can have a shared state between all pages
      case 'login':
      /*--------------------------------------------------------------------------LOGIN PAGE--------------------------------------------------------------------------*/
        return(
          <div className="div">
             <br/>
             <h3>Welcome to Quiplash!</h3>
             <br />
             <form onSubmit={this.Login_handleLogin}>
               <label>
                   Username<input 
                     className="input"
                     type="text"
                     value={this.state.username}
                     onChange={this.Login_handleUsernameChange}
                   />
               </label>
               <br />
               <label>
                   Password <input 
                     className="input"
                     type="text"
                     value={this.state.password}
                     onChange={this.Login_handlePasswordChange}
                     />
               </label>
               <br />
               <input
                 className="padded"
                 type="submit"
                 value="Login"
               />
            </form>
            <button onClick={() => this.setState({currentPage: 'createaccount'})}>Create Account</button>
            {/*Leaderboard button, present on most pages*/}
            <button onClick={this.showLeaderboard} style={{position: 'absolute', bottom: 20, left: ((window.outerWidth - 209.41) / 2)}}>View Lifetime Leaderboard</button> {/*This css is wacky but nothing else was working to send it to the bottom of the screen*/}
          </div>
        );
      case 'createaccount':
      /*--------------------------------------------------------------------------CREATE ACCOUNT PAGE--------------------------------------------------------------------------*/
        return(
          <div className="div">
           <br />
           <h3>Create an Account</h3>
           <br />
           <form onSubmit={this.CreateAccount_handleCreateAccount}>
             <label>
                 Username<input 
                   className="input"
                   type="text"
                   value={this.state.username}
                   onChange={this.Login_handleUsernameChange}
                 />
             </label>
             <br />
             <label>
                 Password <input 
                   className="input"
                   type="text"
                   value={this.state.password}
                   onChange={this.Login_handlePasswordChange}
                   />
             </label>
             <br />
             <input
               className="padded"
               type="submit"
               value="Create"
             />
          </form>
          <button onClick={() => this.setState({currentPage: 'login'})}>Return to Login</button>
          </div>
        );
      case 'lobby':
      /*--------------------------------------------------------------------------LOBBY PAGE--------------------------------------------------------------------------*/
        var playersList = [];
        for (var i in this.state.players){
          playersList.push(<li key={i}>{this.state.players[i]}</li>);
        }
        return(
          <div className="div">
            {/*If there is no game, show the button to create one*/}
            {(!this.state.gameGathering && !this.state.gameRunning) ? 
              <div className="div">
                <p>There is no game currently running.</p>
                <button onClick={this.Lobby_createGame}>New Game</button>
              </div>
            : null}
            {/*If the game is gathering players, show the list of players that have joined, the button to join, the button to start (if you have joined)*/}
            {(this.state.gameGathering && !this.state.gameRunning) ?
              <div className="div">
                <h3>The game is gathering players.</h3>
                <ul className="list">{playersList}</ul>
                {/*If the player has joined, show the button to start, otherwise show the button to join*/}
                <br />
                {this.state.players.includes(this.state.username) ? 
                  <button onClick={this.Lobby_startGame}>Start Game</button>
                : <button onClick={this.Lobby_joinGame}>Join Game</button>}
                {/*Tells the player whether they're in the game or not*/}
                <br />
                <br />
                {this.state.players.includes(this.state.username) ? 
                  <p>You're in! Wait for more players to join, or click Start Game when everybody's ready.</p>
                : <p>You're not in the game yet.</p>}
              </div>
            : null}
            {(!this.state.gameGathering && this.state.gameRunning) ?
              <div className="div">
                <h3>The game has started!</h3> {/*Should only show this for a split second while the matchups are being generated by the server*/}
              </div>  
            : null}
            {/*Leaderboard button, present on most pages*/}
            <button onClick={this.showLeaderboard} style={{position: 'absolute', bottom: 20, left: ((window.outerWidth - 209.41) / 2)}}>View Lifetime Leaderboard</button> {/*This css is wacky but nothing else was working to send it to the bottom of the screen*/}
          </div>
        );
      case 'submitprompts':
      /*------------------------------------------------------------------------SUBMIT PROMPTS PAGE------------------------------------------------------------------------*/
        return(
          <div className="div">
            {this.state.timeLeft ? 
              <h2>Time left: {this.state.timeLeft}</h2>
            : null}
            <br/>
            {/*If neither prompt has been submitted, show form to submit first prompt*/}
            {(!this.state.prompt1answer && !this.state.prompt2answer) ? 
              <div className="div">
                <h3> {this.state.prompt1} </h3>
                 <form onSubmit={this.Prompts_handleSubmission1}>
                   <label>
                       Your answer: <input
                         className="input" 
                         type="text"
                         value={this.state.inputtedPromptAnswer}
                         onChange={this.Prompts_handlePromptAnswerChange}
                       />
                   </label>
                   <br />
                   <input
                     type="submit"
                     value="Submit"
                   />
                </form>
              </div>
            : null}
            {/*If the first prompt has been submitted but the second hasn't, show form to submit second prompt*/}
            {(this.state.prompt1answer && !this.state.prompt2answer) ?
              <div className="div">
                <h3> {this.state.prompt2} </h3>
                 <form onSubmit={this.Prompts_handleSubmission2}>
                   <label>
                       Your answer: <input 
                         className="input"
                         type="text"
                         value={this.state.inputtedPromptAnswer}
                         onChange={this.Prompts_handlePromptAnswerChange}
                       />
                   </label>
                   <br />
                   <input
                     type="submit"
                     value="Submit"
                   />
                </form>
              </div>
            : null}
            {/*If both prompts have been submitted, show user the prompts they submitted*/}
            {(this.state.prompt1answer && this.state.prompt2answer) ? 
              <div className="div">
                <h3>You have submitted all your prompts. Sit back and relax!</h3>
                <h4>Prompt 1: {this.state.prompt1}</h4>
                <p>Your answer: {this.state.prompt1answer}</p>
                <h4>Prompt 2: {this.state.prompt2}</h4>
                <p>Your answer: {this.state.prompt2answer}</p>
                {/*Leaderboard button, present on most pages*/}
                <button onClick={this.showLeaderboard} style={{position: 'absolute', bottom: 20, left: ((window.outerWidth - 209.41) / 2)}}>View Lifetime Leaderboard</button> {/*This css is wacky but nothing else was working to send it to the bottom of the screen*/}
              </div>
            : null}
          </div>
        );
      case 'timeup':
        /*-----------------------------------------------------------------SUBMISSION TIME UP PAGE------------------------------------------------------------------------*/
        return(
          <div className="div">
            <h2>Time's up!</h2>
            <h4>Get ready to vote...</h4>
          </div>
        )
      case 'voting':
      /*--------------------------------------------------------------------------VOTING PAGE--------------------------------------------------------------------------*/
        /*voteMessage displays when either the user has submitted their vote or when they have no vote to submit (i.e. one of the prompts is their own). 
        If one of the prompts is their own, voteMessage is "This is one of your prompts," otherwise it's "Thank you for your vote"*/
        let voteMessage = 'Thank you for your vote!';
        let ownPrompt = false;
        if(this.state.currentMatchup){
          ownPrompt = this.state.currentMatchup.player1 === this.state.username || this.state.currentMatchup.player2 === this.state.username;
          if (ownPrompt){
            voteMessage = 'This is one of your prompts. Good luck!';
          }
        }
        return(
          <div className="div">
            {this.state.timeLeft && !this.state.showVotes ? 
              <h2>Time left: {this.state.timeLeft}</h2>
            : null}
            <br />
            {/*If voting is still happening*/}
            {this.state.currentMatchup && this.state.canVote ? 
              <div className="div">
                <h3>{this.state.currentMatchup.prompt}</h3>
                <br />
                {/*If user hasn't voted and it's not one of their own prompts, show prompts and buttons to vote. Otherwise, show just the prompts and voteMessage*/}
                {(this.state.hasVoted === false && this.state.currentMatchup.player1 !== this.state.username && this.state.currentMatchup.player2 !== this.state.username) ? 
                  <div className="div">
                    <h4>Answer 1: {this.state.currentMatchup.player1answer}</h4>
                    <button onClick={() => this.Voting_handleVote(1)}>Vote for Answer #1</button>
                    <br />
                    <br />
                    <h4>Answer 2: {this.state.currentMatchup.player2answer}</h4>
                    <button onClick={() => this.Voting_handleVote(2)}>Vote for Answer #2</button>
                  </div>
                : <div className="div">
                  <h4>Answer 1: {this.state.currentMatchup.player1answer}</h4>
                  <h4>Answer 2: {this.state.currentMatchup.player2answer}</h4>
                  <p>{voteMessage}</p>
                </div>}
              </div>
            : null}
            {/*If voting is complete*/}
            {this.state.showVotes ? 
              <div className="div">
                <h2>Final votes:</h2>
                <h4>{this.state.votes[0]}</h4>
                <h4>{this.state.votes[1]}</h4>
              </div>
            : null}
            {/*Leaderboard button, present on most pages*/}
            <button onClick={this.showLeaderboard} style={{position: 'absolute', bottom: 20, left: ((window.outerWidth - 209.41) / 2)}}>View Lifetime Leaderboard</button> {/*This css is wacky but nothing else was working to send it to the bottom of the screen*/}
          </div>
        );
      case 'end':
      /*--------------------------------------------------------------------------GAME END PAGE--------------------------------------------------------------------------*/
        var endPointsList = [];
        for (var j in this.state.endPointsArray){
          endPointsList.push(<li key={j}>{this.state.endPointsArray[j][0] + ': ' + this.state.endPointsArray[j][1]}</li>)
        }
        var playersListEnd = [];
        for (var k in this.state.players){
          playersListEnd.push(<li key={k}>{this.state.players[k]}</li>);
        }
        return(
          <div className="div">
            {/*Final Score*/}
            <h2>Game over!</h2>
            <h3>Final score:</h3>
            <ol className="list">{endPointsList}</ol>
            {/*Leaderboard button, present on most pages*/}
            <br />
            <button onClick={this.showLeaderboard} className="padded">View Lifetime Leaderboard</button>
            <br />
            {/*If there is no game, show the button to create one*/}
            {(!this.state.gameGathering && !this.state.gameRunning) ? 
              <div className="div">
                <button onClick={this.Lobby_createGame}>New Game</button>
              </div>
            : null}
            {/*If the game is gathering players, show the list of players that have joined, the button to join, the button to start (if you have joined)*/}
            {(this.state.gameGathering && !this.state.gameRunning) ?
              <div className="div">
                <h3>The game is gathering players.</h3>
                <ul className="list">{playersListEnd}</ul>
                {/*If the player has joined, show the button to start, otherwise show the button to join*/}
                {this.state.players.includes(this.state.username) ? 
                  <button onClick={this.Lobby_startGame} className="padded">Start Game</button>
                : <button onClick={this.Lobby_joinGame} className="padded">Join Game</button>}
                {/*Tells the player whether they're in the game or not*/}
                {this.state.players.includes(this.state.username) ? 
                  <p>You're in! Wait for more players to join, or click Start Game when everybody's ready.</p>
                : <p>You're not in the game yet.</p>}
              </div>
            : null}
            {(!this.state.gameGathering && this.state.gameRunning) ?
              <div className="div">
                <h3>The game has started!</h3> {/*Should only show this for a split second while the matchups are being generated by the server*/}
              </div>  
            : null}
          </div>
        )
      case 'leaderboard':
      /*--------------------------------------------------------------------------LEADERBOARD PAGE--------------------------------------------------------------------------*/
        var leaderboardRows = [];
        if(this.state.leaderboardArray !== null){
          for (var l in this.state.leaderboardArray){
            leaderboardRows.push(
              <tr key={l}>
                <td>{this.state.leaderboardArray[l].username}</td>
                <td>{Number.parseFloat(this.state.leaderboardArray[l].points / this.state.leaderboardArray[l].games).toFixed(1)}</td>
                <td>{this.state.leaderboardArray[l].points}</td>
                <td>{this.state.leaderboardArray[l].games}</td>
              </tr>
            );
            /*Number.parseFloat.toFixed rounds average points to 1 decimal place*/
          }
        }
        return(
          <div className="div">
            <button onClick={() => this.setState({currentPage: this.state.prevPage})}>Back</button>
            <Table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Avg. Points</th>
                  <th>Total Points</th>
                  <th>Games Played</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardRows}
              </tbody>
            </Table>
          </div>
        )
      default:
      /*--------------------------------------------------------------------------404 PAGE--------------------------------------------------------------------------*/
        return(
          //This shouldn't ever display because currentPage is set in state
          <div className="div">
            <h3>Page not found.</h3>
            <button onClick={() => this.setState({currentPage: 'login'})}>Login</button>
          </div>
        );
    }
  }

  //When component mounts, start listening for any socket info
  componentDidMount() {
    this.state.socket.on('game created', () => this.setState({gameGathering: true}));
    this.state.socket.on('user joined', (players) => this.setState({players: players}));
    this.state.socket.on('game started', () => this.setState({gameGathering: false, gameRunning: true}));
    this.state.socket.on('round started', (matchupInfo) => this.Prompts_roundStart(matchupInfo));
    this.state.socket.on('get ready to vote', () => this.setState({currentPage: 'timeup'}))
    this.state.socket.on('voting started', () => this.setState({currentPage: 'voting'}));
    this.state.socket.on('new duel', (matchup) => this.setState({currentMatchup: matchup, canVote: true, hasVoted: false, showVotes: false, votes: [0,0]}));
    this.state.socket.on('show votes', (votes) => this.setState({votes: votes, canVote: false, showVotes: true}))
    this.state.socket.on('timer', (timeLeft) => this.setState({timeLeft: timeLeft}));
    this.state.socket.on('round complete', (info) => this.setState({
      timeLeft: null,
      gameGathering: false,
      gameRunning: false,
      players: [],
      prompt1: null,
      prompt2: null,
      inputtedPromptAnswer: "",
      prompt1answer: null,
      prompt2answer: null,
      prompt1index: null,
      prompt2index: null,
      currentMatchup: null,
      canVote: false,
      hasVoted: false,
      votes: ['',''],
      endPointsArray: info.pointsArray,
      currentPage: 'end'
    }));
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

export default App;