"use strict"

function Game(socket, players, steps) {
	var board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	var winArr = [
				[1, 2, 3, 6, 4, 8],
				[0, 2, 4, 7],
				[0, 1, 5, 8, 4, 6],
				[0, 6, 4, 5],
				[0, 8, 1, 7, 2, 6, 3, 5],
				[2, 8, 3, 4],
				[0, 3, 2, 4, 7, 8],
				[1, 4, 6, 8],
				[0, 4, 2, 5, 6, 7]
			];
	
	var TTT = $('.TTT');
	var result = TTT.find('.result h2');
	var playBoard = TTT.find('.board');
	
	if(playBoard.hasClass('finish')) {
		playBoard.html($('.hidden').find(".board").children().clone());
		playBoard.removeClass('finish');
	}
	
	var sender;
	if(steps & 1) {
		sender = false; 
		result.text(players.sender.username + "'s turn"); 
		TTT.find('.board input').prop('disabled', true);
	}
	else {
		sender = true; 
		result.text('your turn'); 
		TTT.find('.board input').prop('disabled', false);
	}
	
	TTT.on('change', '.block input', oneStep);
	
	socket.on('sender turn', playerTurn);
	socket.on('receiver turn', playerTurn);
	
	function playerTurn(data) {
		var eventBlock = $($('.TTT').find('.block').get(data.position));
		var circle = 1;
		var cross = -1;
		if(!data.circle) {
			var cloneCross = $(".hidden-cross").clone();
			cloneCross.attr("class", "cross");
			cloneCross.appendTo(eventBlock);
			board[data.position] = cross;
		}
		else {
			var cloneCircle = $(".hidden-circle").clone();
			cloneCircle.attr("class", "circle");
			cloneCircle.appendTo(eventBlock);
			board[data.position] = circle;
		}
		
		var playBoard = TTT.find(".board");
		var boardInput = playBoard.find("input");
		var finished = isFinished(sender, data.position, playBoard);
		if(!finished) {
			steps = data.steps + 1;
			result.text('your turn'); 
			boardInput.prop('disabled', false);
		}
		else {
			var closestBoard = playBoard;
			closestBoard.addClass('finish');
			closestBoard.find('input').each(function() {
				if($(this).prop('disabled') === false) $(this).prop('disabled', true);
			});
		}
	}
	
	function oneStep(event) {
		var eventTarget = $(event.target);
		var eventBlock = $(event.target).parent('.block');
		var boardInput = TTT.find('.board input');
		eventBlock.find('input').prop('disabled', true);
		eventBlock.css('pointer-events', 'none');
		
		var circle = 1;
		var cross = -1;
		
		var blockIndex = eventBlock.closest(".board").find(".block").index(eventBlock);
		if(steps & 1) {
			var cloneCross = $(".hidden-cross").clone();
			cloneCross.attr("class", "cross");
			cloneCross.appendTo(eventBlock);
			board[blockIndex] = cross;
			socket.emit('receiver turn', {players: players, position: blockIndex, steps: steps, circle: false});
		}
		else {
			var cloneCircle = $(".hidden-circle").clone();
			cloneCircle.attr("class", "circle");
			cloneCircle.appendTo(eventBlock);
			board[blockIndex] = circle;
			socket.emit('sender turn', {players: players, position: blockIndex, steps: steps, circle: true});
		}
		
		var finished = isFinished(sender, blockIndex, eventTarget.closest(".board"));
		if(!finished) {
			steps += 1;
			
			if(sender) {
				result.text(players.receiver.username + "'s turn");
				boardInput.prop('disabled', true);
			}
			else {
				result.text(players.sender.username + "'s turn");
				boardInput.prop('disabled', true);
			}
		}
		else {
			var closestBoard = eventTarget.closest(".board");
			closestBoard.addClass("finish");
			closestBoard.find("input").each(function() {
				if($(this).prop("disabled")===false) $(this).prop("disabled", "true");
			});
		}
	}
	
	function isFinished(sender, blockIndex, boardSelector) {
		var sum = 0;
		for(var i = 0; i < winArr[blockIndex].length; i += 2) {
			sum = board[blockIndex] + 
					  board[winArr[blockIndex][i]] +
					  board[winArr[blockIndex][i + 1]];
			if(sum === -3 || sum === 3) {
				if(sum === -3) {
					if(sender) {
						boardSelector.closest('.game').find('h2').text('Sorry, you lose!');
						socket.emit('lose game', {username: players.sender.username, socketId: socket.id});
					}
					else {
						boardSelector.closest('.game').find('h2').text('Cong! you win!');
						socket.emit('win game', {username: players.receiver.username, socketId: socket.id});
					}
				}
				if(sum === 3) {
					if(sender) {
						boardSelector.closest('.game').find('h2').text('Cong! you win!');
						socket.emit('win game', {username: players.sender.username, socketId: socket.id});
					}
					else {
						boardSelector.closest('.game').find('h2').text('Sorry, you lose!');
						socket.emit('lose game', {username: players.receiver.username, socketId: socket.id});
					}
				}
				var $block = boardSelector.find('.block');
				$($block.get(blockIndex)).find('svg').css('stroke', 'red');
				$($block.get(winArr[blockIndex][i])).find('svg').css('stroke', 'red');
				$($block.get(winArr[blockIndex][i + 1])).find('svg').css('stroke', 'red');
				restart();
				return true;
			}
		}
		if(steps === 8 ) {
			if(sender) socket.emit('draw game', {username: players.sender.username, socketId: socket.id});
			else socket.emit('draw game', {username: players.receiver.username, socketId: socket.id});
			boardSelector.closest('.game').find('h2').text('draw');
			restart();
			return true;
		}
		return false;
	}
	
	function restart() {
		steps = 0;
		board = [0, 0, 0, 0, 0, 0, 0, 0];
		
		TTT.off('change', '.block input', oneStep);
	
		socket.off('sender turn', playerTurn);
		socket.off('receiver turn', playerTurn);
	}
	
	function cleanBoard() {
		restart();
		playBoard.html($('.hidden').find(".board").children().clone());
		playBoard.removeClass('finish');
		result.html('&nbsp;');
	}
	
	return cleanBoard;
}

var RunTicTacToe = function(socket, user) {
	var usersArray = [];
    var client = user;
    client.socketId = socket.id;
    
    var cleanBoard;
    
    var switchInput = $('.switch input');
    var switchLogOut = $('.switch');
    var signUp = $('#sign-up');
    var logIn = $('#log-in');
    var playersUl = $('#players-ul');
    var playersLi;
    var players = $('#players');
    var gameTitle = $('.game h1');
    var TTT = $('.TTT');
    var username = $('.username');
    var playBoard = TTT.find('.board');
    
    switchInput.prop('checked', true);
    switchLogOut.css('pointer-events', 'auto');
    switchLogOut.css('opacity', 1);
    
    signUp.hide();
    logIn.hide();
    
    switchInput.click(switchInputonClick);
	players.on('click', playersonClick);
	
    socket.emit('add user', {username: user.username});
	socket.emit('get usersArray');
	    
	socket.on('get usersArray', getUsersArray);
	socket.on('user joined', getUsersArray);
	socket.on('user left', getUsersArray);
	socket.on('request to play', requestToPlay);
	socket.on('response from receiver', responseFromReceiver);
	socket.on('player left', cleanState);
	
	function cleanState() {
		gameTitle.html('choose one <div class="green state"></div> player online');
		if(playBoard.hasClass('finish')) playBoard.removeClass('finish');
		playBoard.html($('.hidden').find(".board").children().clone());
		cleanBoard();
	}
	
	function getUsersArray(data) {
		var ul = playersUl;
		ul.children().remove('li');
		usersArray = showList(ul, data);
		playersLi = $('#players li');
	}
	
	function requestToPlay(data) {
		var confirmPopup = $('.confirm');
		confirmPopup.find('p').html('<strong>' + data.sender.username + '</strong> wants to play with you, do you accept?');
		confirmPopup.addClass('is-visible');
		
		var accept = false;
		confirmPopup.on('click', function(event){
			if($(event.target).is('.confirm .cd-buttons li:first-child a')) {
				accept = true;
			}
			if($(event.target).is('.confirm .cd-buttons li:last-child a')) {
				accept = false;
			}
			$(this).removeClass('is-visible');
			
			if (accept === true) {
				socket.emit('response from receiver', {sender: data.sender, receiver: data.receiver, accept: true});
				for(var i = 0; i < usersArray.length; i++) {
					if(usersArray[i].socketId === data.sender.socketId) {
			        	usersArray[i].state = 'busy';
			        	gameTitle.html('playing with <span>' + data.sender.username.toUpperCase() + '</span>');
			        	$(playersLi.get(i)).find('.state').toggleClass('green').addClass('red');
					}
		        }
				cleanBoard = Game(socket, data, 1);
			} else {
				socket.emit('response from receiver', {sender: data.sender, receiver: data.receiver, accept: false});
			}
		});
	}
	
	function responseFromReceiver(data) {
		var i = 0;
		for(; i < usersArray.length; i++) {
	        if(usersArray[i].socketId === data.receiver.socketId) {
		        $(playersLi.get(i)).find('img').remove();
		        break;
			}
	    }
		$(playersLi.get(i)).css('pointer-events', 'auto');
		
		if(data.accept) {
	        cleanBoard = Game(socket, data, 0);
	        
		    usersArray[i].state = 'busy';
		    gameTitle.html('playing with <span>' + data.receiver.username.toUpperCase() + '</span>');
		    $(playersLi.get(i)).find('.state').toggleClass('green').addClass('red');
	    }
		else {
			var alertPopup = $('.alert');
			alertPopup.find('p').html('<strong>' + data.receiver.username + '</strong> can\'t play now!');
			alertPopup.addClass('is-visible');
			
			alertPopup.on('click', function(event){
				if($(event.target).is('.cd-popup-close')) {
					$(this).removeClass('is-visible');
				}
			});
		}
	}
	
	function switchInputonClick(event) {
		var logOut = event.target;
		if(!logOut.checked) {
			socket.emit('log out');
			
			if(playBoard.hasClass('finish')) playBoard.removeClass('finish');
			playBoard.html($('.hidden').find(".board").children().clone());
			if(cleanBoard) cleanBoard();
			
			TTT.hide();
			logIn.show();
			username.remove();
			switchLogOut.css('pointer-events', 'none');
			switchLogOut.css('opacity', 0.3);
			switchInput.off('click', switchInputonClick);
			
			players.off('click', playersonClick);
			socket.off('get usersArray', getUsersArray);
			socket.off('user joined', getUsersArray);
			socket.off('user left', getUsersArray);
			socket.off('request to play', requestToPlay);
			socket.off('response from receiver', responseFromReceiver);
		}
		else switchLogOut.css('pointer-events', 'auto');
	}
	
	function playersonClick(event) {
		var closestLi = $(event.target).closest('li');
		closestLi.css('pointer-events', 'none');
		var player = usersArray[playersLi.index(closestLi)];
		
		if(player) {
			if(player.state === 'available') {
				closestLi.append('<img src="waiting.gif" alt="waiting">');
				socket.emit('send game request', {
					sender: {username: client.username}, 
					receiver: {username: player.username, socketId: player.socketId}
				});
			}
			else {
				var alertPopup = $('.alert');
				alertPopup.find('p').html('<strong>' + player.username + '</strong> is playing!');
				alertPopup.addClass('is-visible');
				
				alertPopup.on('click', function(event){
					if($(event.target).is('.cd-popup-close')) {
						$(this).removeClass('is-visible');
					}
				});
			}
		}
	}
	
	function showList(ul, data) {
		var stateCircle;
		for(var i = 0; i < data.length; i++) {
			var user = data[i];
			if(user.socketId === client.socketId) {
				data.splice(i, 1); 
				i--;
				continue;
			}
			if(user.state === 'available') {
			    stateCircle = '<div class="green state"></div>';
			}
			if(user.state === 'busy') {
				stateCircle = '<div class="red state"></div>';
			}
			ul.append('<li>' + stateCircle + '<a>' + user.username + '</a></li>');
		}
		return data;
	}
}

function userLogin(username, password, type) {
	var socket = io();
	
	var user = {username: username, type: type, password: password};
	socket.emit('authentication', user);
		
	socket.on('authenticated', () => {
		console.log('User authentictaed!');
		$('.username').remove();
		$('header li:first-child svg').after('<div class="username">Hi, ' + username + '</div>');
		$('.TTT').show();
		$('.TTT').css('display', 'flex');
		RunTicTacToe(socket, user);
	});
	
	socket.on('unauthorized', () => {
		console.log('User not authorized!');
		
		var popup = $('.popuptext');
		popup.toggleClass('show');
		popup.focus();
	});
}

$(function() {
	$('#log-in form').submit(function(event) {
		event.preventDefault();
		
		var username = $('#log-username').val();
		var password = $('#log-password').val();
		
		userLogin(username, password, 'log-in');
	
	});
	
	$('#sign-up form').submit(function(event) {
		event.preventDefault();
		
		var username = $('#sign-username').val();
		var password = $('#sign-password').val();
		
		userLogin(username, password, 'sign-up');
	});
	
	$('#sign-up-link').click(function() {
		$('#log-in').hide();
		$('#sign-up').show();
		$('#sign-up').css('display', 'flex');
	});
	
	$('#log-in-link').click(function() {
		$('#log-in').show();
		$('#sign-up').hide();
	});
	
	$('form input').focus(function() {
		$('.popuptext').removeClass('show');
	});
});
