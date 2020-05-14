import React from "react";
import ReactDOM from 'react-dom';
import socketIOClient from "socket.io-client";
import "./App.css";

class App extends React.Component{

  constructor(props){
    super(props);
    this.state = {
      socket: socketIOClient('http://localhost:8080'),
      timeLeft: null,
      username: "test user",
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
      currentPage: 'login'
    };
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
  }

  Login_handleUsernameChange(event){
    this.setState({
      username: event.target.value
    });
  }

  Login_handlePasswordChange(event){
    this.setState({
      password: event.target.value
    });
  }

  Login_handleLogin(event){
    event.preventDefault();
    if (this.state.username && this.state.password){ //TODO: check with server -> database for valid account instead of automatically logging in
      this.setState({
        currentPage: 'lobby'
      });
    }
  }

  CreateAccount_handleCreateAccount(event){
    event.preventDefault();
    if (this.state.username && this.state.password){
      fetch('http://localhost:8080/createaccount', {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
         username: this.state.username, 
         password: this.state.password,
        }),
      })
      .then(
        this.setState({
          currentPage: 'login'
        }) 
      )
      .catch(err => err)
    }
  }

  Lobby_createGame(){
    this.state.socket.emit('game creating');
    this.Lobby_joinGame();
  }

  Lobby_joinGame(){
    this.state.socket.emit('user joining', this.state.username);
  }

  Lobby_startGame(){
    if (this.state.players.length >= 3){
      this.state.socket.emit('game starting');
    }else{
      alert('The game needs at least 3 players.')
    }
  }

  Prompts_roundStart(matchupInfo){
    let matchupIndex = matchupInfo.matchupIndex;
    let matchups = matchupInfo.matchups;
    let indexPosition = matchupIndex.indexOf(this.state.username); //Finds user's position in matchupIndex in order to assign them the appropriate prompts
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
  }

  Prompts_handlePromptAnswerChange(event){
    this.setState({
      inputtedPromptAnswer: event.target.value
    });
  }

  Prompts_handleSubmission1(event){
    event.preventDefault();
    if (this.state.inputtedPromptAnswer !== ""){ //Prevents accidentally clicking submit when prompt is empty
      let answer = this.state.inputtedPromptAnswer;
      this.setState({
        prompt1answer: answer,
        inputtedPromptAnswer: ""
      });
    }
  }

  Prompts_handleSubmission2(event){
    event.preventDefault();
    if (this.state.inputtedPromptAnswer !== ""){ //Prevents accidentally clicking submit when prompt is empty
      let answer = this.state.inputtedPromptAnswer;
      //If both prompts have now been submitted, broadcast submission to the server
      if(this.state.prompt1answer){
        this.state.socket.emit('user submitted', {
          username: this.state.username,
          prompt1: this.state.prompt1,
          prompt2: this.state.prompt2,
          prompt1answer: this.state.prompt1answer,
          prompt2answer: answer,
          prompt1index: this.state.prompt1index,
          prompt2index: this.state.prompt2index
        });
      }
      this.setState({
        prompt2answer: answer,
        inputtedPromptAnswer: ""
      });
    }
  }

  render(){
    switch (this.state.currentPage){ //Using currentPage on one file rather than something like react-router so I can have a shared state between all pages
      case 'login':
      /*--------------------------------------------------------------------------LOGIN PAGE--------------------------------------------------------------------------*/
        return(
          <div>
             <h3>Welcome to Quiplash!</h3>
             <form onSubmit={this.Login_handleLogin}>
               <label>
                   Username<input 
                     type="text"
                     value={this.state.username}
                     onChange={this.Login_handleUsernameChange}
                   />
               </label>
               <br></br>
               <label>
                   Password <input 
                     type="text"
                     value={this.state.password}
                     onChange={this.Login_handlePasswordChange}
                     />
               </label>
               <br></br>
               <input
                 type="submit"
                 value="Login"
               />
            </form>
            <button onClick={() => this.setState({currentPage: 'createaccount'})}>Create Account</button>
          </div>
        );
      case 'createaccount':
      /*--------------------------------------------------------------------------CREATE ACCOUNT PAGE--------------------------------------------------------------------------*/
        return(
          <div>
           <h3>Create an Account</h3>
           <form onSubmit={this.CreateAccount_handleCreateAccount}>
             <label>
                 Username<input 
                   type="text"
                   value={this.state.username}
                   onChange={this.Login_handleUsernameChange}
                 />
             </label>
             <br></br>
             <label>
                 Password <input 
                   type="text"
                   value={this.state.password}
                   onChange={this.Login_handlePasswordChange}
                   />
             </label>
             <br></br>
             <input
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
          <div>
            {/*If there is no game, show the button to create one*/}
            {(!this.state.gameGathering && !this.state.gameRunning) ? 
              <div>
                <p>There is no game currently running.</p>
                <button onClick={this.Lobby_createGame}>New Game</button>
              </div>
            : null}
            {/*If the game is gathering players, show the list of players that have joined, the button to join, the button to start (if you have joined)*/}
            {(this.state.gameGathering && !this.state.gameRunning) ?
              <div>
                <h3>The game is gathering players.</h3>
                <ul>{playersList}</ul>
                {/*If the player has joined, show the button to start, otherwise show the button to join*/}
                {this.state.players.includes(this.state.username) ? 
                  <button onClick={this.Lobby_startGame}>Start Game</button>
                : <button onClick={this.Lobby_joinGame}>Join Game</button>}
                {/*Tells the player whether they're in the game or not*/}
                {this.state.players.includes(this.state.username) ? 
                  <p>You're in! Wait for more players to join, or click Start Game when everybody's ready.</p>
                : <p>You're not in the game yet.</p>}
              </div>
            : null}
            {(!this.state.gameGathering && this.state.gameRunning) ?
              <div>
                <h3>The game has started!</h3> {/*Should only show this for a split second while the matchups are being generated by the server*/}
              </div>  
            : null}
          </div>
        );
      case 'submitprompts':
      /*------------------------------------------------------------------------SUBMIT PROMPTS PAGE------------------------------------------------------------------------*/
        return(
          <div>
            {this.state.timeLeft ? 
              <h2>Time left: {this.state.timeLeft}</h2>
            : null}
            {/*If neither prompt has been submitted, show form to submit first prompt*/}
            {(!this.state.prompt1answer && !this.state.prompt2answer) ? 
              <div>
                <h3> {this.state.prompt1} </h3>
                 <form onSubmit={this.Prompts_handleSubmission1}>
                   <label>
                       Your answer: <input 
                         type="text"
                         value={this.state.inputtedPromptAnswer}
                         onChange={this.Prompts_handlePromptAnswerChange}
                       />
                   </label>
                   <br></br>
                   <input
                     type="submit"
                     value="Submit"
                   />
                </form>
              </div>
            : null}
            {/*If the first prompt has been submitted but the second hasn't, show form to submit second prompt*/}
            {(this.state.prompt1answer && !this.state.prompt2answer) ?
              <div>
                <h3> {this.state.prompt2} </h3>
                 <form onSubmit={this.Prompts_handleSubmission2}>
                   <label>
                       Your answer: <input 
                         type="text"
                         value={this.state.inputtedPromptAnswer}
                         onChange={this.Prompts_handlePromptAnswerChange}
                       />
                   </label>
                   <br></br>
                   <input
                     type="submit"
                     value="Submit"
                   />
                </form>
              </div>
            : null}
            {/*If both prompts have been submitted, show user the prompts they submitted*/}
            {/*TODO: allow users to change prompts before time runs out*/}
            {(this.state.prompt1answer && this.state.prompt2answer) ? 
              <div>
                <h3>You have submitted all your prompts. Sit back and relax!</h3>
                <h4>Prompt 1: {this.state.prompt1}</h4>
                <p>Your answer: {this.state.prompt1answer}</p>
                <h4>Prompt 2: {this.state.prompt2}</h4>
                <p>Your answer: {this.state.prompt2answer}</p>
              </div>
            : null}
          </div>
        );
      case 'voting':
      /*--------------------------------------------------------------------------VOTING PAGE--------------------------------------------------------------------------*/
        return(
        {/*Placeholder, need to work on this next*/}
          <h1>vote</h1>
        );
      default:
      /*--------------------------------------------------------------------------NO MATCH PAGE--------------------------------------------------------------------------*/
        return(
          <div>
            <h3>Page not found.</h3>
            <button onClick={() => this.setState({currentPage: 'login'})}>Login</button>
          </div>
        );
    }
  }

  //When component mounts, start listening for any socket info
  componentDidMount() {
    //TODO: need to add some sort of request to the server to get all relevant socket info if someone reloads
    this.state.socket.on('game created', () => this.setState({gameGathering: true}));
    this.state.socket.on('user joined', (players) => this.setState({players: players}));
    this.state.socket.on('duplicate username', (username) => {if(this.state.username === username){alert('Game cannot contain 2 players with the same username. If you are already in the list of players, you may ignore this error.')}});
    this.state.socket.on('game started', () => this.setState({gameGathering: false, gameRunning: true}));
    this.state.socket.on('round started', (matchupInfo) => this.Prompts_roundStart(matchupInfo));
    this.state.socket.on('voting started', () => this.setState({currentPage: 'voting'}));
    this.state.socket.on('timer', (timeLeft) => this.setState({timeLeft: timeLeft}));
  }

}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

export default App;