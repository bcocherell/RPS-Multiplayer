
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

var playerName;
var playerId;
var playerMove = '';
var playerWins = 0;
var playerLosses = 0;

var opponentName;
var opponentId;
var opponentMove = '';

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

  playerId = determinePlayerNum();

  var playerRef = database.ref('players/' + playerId);

  playerRef.set(player);
  playerRef.onDisconnect().remove();
  
});

// Perform action when player added
database.ref('players').on("child_added", function(childSnapshot, prevChildKey) {
  currentPlayers.push(childSnapshot.key);
  setupPlayer(childSnapshot);

  if (currentPlayers.length === 2) {
  	database.ref('turn').set(1);
  }

});

database.ref('players').on("child_changed", function(snapshot) {
  if (playerId == snapshot.key) {
  	playerMove = snapshot.val().choice;
  }
  else {
	opponentMove = snapshot.val().choice;
  }
  $('#wins-player-' + snapshot.key).text(snapshot.val().wins);
  $('#losses-player-' + snapshot.key).text(snapshot.val().losses);
});

// Perform action when player removed
database.ref('players').on("child_removed", function(snapshot) {
  currentPlayers.splice(currentPlayers.indexOf(snapshot.key), 1);
  database.ref('turn').set(0);
  clearPlayer(snapshot);
});

database.ref('turn').on("value", function(snapshot) {
  
	if (snapshot.val() === 0 && playerMove !== '' && opponentMove !== '') {
		determineWinner ();
	}

  	if (playerId === snapshot.val()){
  		displayRPSSelection(snapshot);
  		$('#user-message').text("It's your turn!");
  	}
  	else if (snapshot.val()) {
  		$('#user-message').text('Waiting for ' + opponentName + ' to choose');	
  	}
  
});

function determinePlayerNum() {
	// Checks the currentPlayers array, returns playerId
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

function clearPlayer(snapshot) {

	playerInfoDiv = $('#player-' + snapshot.key);
	h3 = $('<h3 class="text-center">').text('Waiting for Player ' + snapshot.key);

	playerInfoDiv.empty();
	playerInfoDiv.append(h3);

	$('#rps-player-' + playerId).empty();
	$('#user-message').empty();

	var chat = {
	    player: opponentId,
	    text: opponentName + ': Disconnected'
	  };

	database.ref('chats').push(chat);	
}

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

$(document).on('click','.rps', function() {
    var rpsValue = $(this).attr("data-rpsvalue");
    $('#rps-player-' + playerId).empty();
    var h1 = $('<h1 class="text-center">').text(rpsValue);
    $('#rps-player-' + playerId).append(h1);
    database.ref('players/' + playerId + '/choice').set(rpsValue);

	if (playerId == 2) {
    	database.ref('turn').set(0);	
	}
	else {
		database.ref('turn').set(parseInt(opponentId));	
	}
});

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

	  database.ref('chats').push(chat);	
  }
  
});

// Perform action when player added
database.ref('chats').on("child_added", function(childSnapshot, prevChildKey) {
  	chatDiv = $('<div>').addClass('chat-player-' + childSnapshot.val().player);
	chatDiv.text(childSnapshot.val().text);
	$('#chat').append(chatDiv);
});