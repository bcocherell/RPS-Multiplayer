
// Initialize Firebase
var config = {
apiKey: "AIzaSyDRyf0RTVoLMVApG7eVmSIvEZpf8ZzLr3Q",
authDomain: "multi-rps-a4954.firebaseapp.com",
databaseURL: "https://multi-rps-a4954.firebaseio.com",
projectId: "multi-rps-a4954",
storageBucket: "",
messagingSenderId: "415274692885"
};

firebase.initializeApp(config);

var database = firebase.database();
var currentPlayers = [];


// local variables to store information from firebase
var playerName;
var playerId;
var playerMove = '';
var playerWins = 0;
var playerLosses = 0;

var opponentName;
var opponentId;
var opponentMove = '';

// Runs when user enters name and clicks 'start'
$(document).on('click','#add-name', function(event) {
  event.preventDefault();

  // Grabs user input
  playerName = $('#name-input').val().trim();
  
  // Creating object for holding player data
  var player = {
    name: playerName,
    wins: 0,
    losses: 0
  };

  // Can either be 1 or 2, depending on which user spot is available at the time
  playerId = determinePlayerNum();

  // Sending player object to firebase, while also setting it up to delete when user disconnects
  var playerRef = database.ref('players/' + playerId);
  playerRef.set(player);
  playerRef.onDisconnect().remove();
  
});

// Perform action when player added
database.ref('players').on("child_added", function(childSnapshot, prevChildKey) {
  
  // Adding user to currentPlayers array and calling setupPlayer
  currentPlayers.push(childSnapshot.key);
  setupPlayer(childSnapshot);

  // If 2 players are in the game, start game by setting 'turn' to 1
  if (currentPlayers.length === 2) {
  	database.ref('turn').set(1);
  }

});

// Perform action when player object updated
database.ref('players').on("child_changed", function(snapshot) {

  // Update either playerMove or opponentMove depending on who just made a selection
  if (playerId == snapshot.key) {
  	playerMove = snapshot.val().choice;
  }
  else {
	opponentMove = snapshot.val().choice;
  }

  // Update span tags to show current wins and losses for player
  $('#wins-player-' + snapshot.key).text(snapshot.val().wins);
  $('#losses-player-' + snapshot.key).text(snapshot.val().losses);
});

// Perform action when player removed
database.ref('players').on("child_removed", function(snapshot) {
  // Remove user from currentPlayers array
  currentPlayers.splice(currentPlayers.indexOf(snapshot.key), 1);
  // Set turn to 0 which stops game temporarily while we wait for another player to join, also call clearPlayer function
  database.ref('turn').set(0);
  clearPlayer(snapshot);
});


// Perform action when 'turn' is updated
database.ref('turn').on("value", function(snapshot) {
  	
  	// If turn is 0 and two choices have been made, game is over so we determine the winner
	if (snapshot.val() === 0 && playerMove !== '' && opponentMove !== '') {
		determineWinner ();
	}

	// If it's our turn, display the rps selection, otherwise display waiting message
  	if (playerId === snapshot.val()){
  		displayRPSSelection(snapshot);
  		$('#user-message').text("It's your turn!");
  	}
  	else if (snapshot.val()) {
  		$('#user-message').text('Waiting for ' + opponentName + ' to choose');	
  	}
  
});

// Determines if you're player 1 or player 2 based on currentPlayers array
function determinePlayerNum() {
	if (currentPlayers.indexOf('1') === -1) {
		return 1;
	}
	else if (currentPlayers.indexOf('2') === -1) {
		return 2;
	}
	else {
		return 0;
	}
}

// Sets up player's screen to display their name & info in their corresponding area
function setupPlayer(snapshot) {

	if (playerId == snapshot.key) {
		playerNameEntryDiv = $('#player-name-entry');
		
		playerNameEntryDiv.empty();
		var h2 = $('<h2 class="text-center">').text('Hi ' + snapshot.val().name + '! You are player ' + playerId);
		var h3 = $('<h3 class="text-center" id="user-message">');
		playerNameEntryDiv.append(h2);		
		playerNameEntryDiv.append(h3);
	}
	else {
		opponentId = snapshot.key;
		opponentName = snapshot.val().name;
	}

	database.ref('players/' + snapshot.key + '/choice').set('');

	playerInfoDiv = $('#player-' + snapshot.key);
	h2 = $('<h2 class="text-center">').text(snapshot.val().name);
	h6 = $('<h6 class="text-center">').html('wins: <span id="wins-player-' + snapshot.key + '">' + snapshot.val().wins + '</span> losses: <span id="losses-player-' + snapshot.key + '">' + snapshot.val().losses + '</span>');
	rpsDiv = $('<div id="rps-player-' + snapshot.key + '">');

	playerInfoDiv.empty();
	playerInfoDiv.append(h2);
	playerInfoDiv.append(h6);
	playerInfoDiv.append(rpsDiv);
}

// Removes player info from screen, also sends 'disconnected' message to chat window
function clearPlayer(snapshot) {

	playerInfoDiv = $('#player-' + snapshot.key);
	h3 = $('<h3 class="text-center">').text('Waiting for Player ' + snapshot.key);

	playerInfoDiv.empty();
	playerInfoDiv.append(h3);

	$('#rps-player-' + playerId).empty();
	$('#user-message').empty();

	var chatDiv = $('<div>').addClass('chat-player-' + opponentId);
	chatDiv.text(opponentName + ': Disconnected');
	$('#chat').append(chatDiv);
}

// Displays selection of 'rock', 'paper', 'scissors' for user to select
function displayRPSSelection(snapshot) {

	if (playerId === snapshot.val()) {
		rps = ['rock', 'paper', 'scissors'];

		$('#rps-player-' + playerId).empty();

		for (var i = 0; i < rps.length; i++){
			var button = $('<button>');
			button.addClass('list-group-item rps');
			button.text(rps[i]);
			button.attr("data-rpsvalue", rps[i]);
			$('#rps-player-' + snapshot.val()).append(button);
		}
	}
}

// When user selects 'rock', 'paper', or 'scissors' update their choice in firebase 
$(document).on('click','.rps', function() {
    var rpsValue = $(this).attr("data-rpsvalue");
    $('#rps-player-' + playerId).empty();
    var h1 = $('<h1 class="text-center">').text(rpsValue);
    $('#rps-player-' + playerId).append(h1);
    database.ref('players/' + playerId + '/choice').set(rpsValue);

    // Set 'turn' to next player. If game is over, set 'turn' to 0 to determine winner and reset game
	if (playerId == 2) {
    	database.ref('turn').set(0);	
	}
	else {
		database.ref('turn').set(parseInt(opponentId));	
	}
});

// Determines if you are a winner or loser and updates your wins/losses in firebase
function determineWinner() {

	var winner;
	var winnerName;

	if (playerMove === opponentMove) {
		winner = 0;
	}
	else if ((playerMove === 'rock' && opponentMove === 'scissors') || (playerMove === 'scissors' && opponentMove === 'paper') || (playerMove === 'paper' && opponentMove === 'rock')) {
		winner = playerId;
		winnerName = playerName;
	}
	else {
		winner = opponentId;
		winnerName = opponentName;
	}

	var h1 = $('<h1 class="text-center">').text(opponentMove);
    $('#rps-player-' + opponentId).append(h1);
	
	if (winner == 0) {
		h1 = $('<h1 class="text-center">').text('Tie!');
	}
	else if (winner == playerId) {
		h1 = $('<h1 class="text-center">').text(winnerName + ' wins!');
		playerWins++;
		database.ref('players/' + playerId + '/wins').set(playerWins);
	}
	else {
		h1 = $('<h1 class="text-center">').text(winnerName + ' wins!');
		playerLosses++;
		database.ref('players/' + playerId + '/losses').set(playerLosses);
	}
	$('#user-message').empty();
	$('#game-status').append(h1);

	database.ref('players/' + playerId + '/choice').set('');

	// After displaying winner for a few seconds, perform some cleanup and restart game by setting 'turn' to 1 (in my game, player 1 is always first to choose)
	setTimeout(function(){
		$('#game-status').empty();

		if (playerId == 1) {
			$('#rps-player-2').empty();	
		}
  		else {
  			$('#rps-player-1').empty();
  			$('#rps-player-2').empty();			
  		}

  		if (playerId == 1) {
  			database.ref('turn').set(1);	
  		}
    }, 3000);
}

// Click event to send chat message to chat window
$(document).on('click','#chat-send', function(event) {
  event.preventDefault();

  if (playerId != undefined) {
	  // Grabs user input
	  var chatText = $('#chat-input').val().trim();
	  
	  // Creating object for holding chat data
	  var chat = {
	    player: playerId,
	    text: playerName + ': ' + chatText
	  };

	  // Remove chats after closing window
	  var chatRef = database.ref('chats');
  	  chatRef.push(chat);
  	  chatRef.onDisconnect().remove();
  }
  
});

// Perform action when chat added
database.ref('chats').on("child_added", function(childSnapshot, prevChildKey) {
	
	// adding chat to chat window only if player selected (prevents new players from seeing old chats from previous games)
	if (playerId != undefined) {
  		chatDiv = $('<div>').addClass('chat-player-' + childSnapshot.val().player);
		chatDiv.text(childSnapshot.val().text);
		$('#chat').append(chatDiv);
	}
});