"use strict"

var Game = function(socket, players, step) {
	this.socket = socket;
	this.players = players;
	this.steps = step;
	this.board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	this.winArr = [
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
			
	this.TTT = $('.TTT');
	this.result = this.TTT.find('.result h2');
	
	if(this.steps & 1) {
		this.sender = false; 
		this.result.text(this.players.receiver.username + "'s turn"); 
		this.TTT.find('.board input').prop('disabled', true);
	}
	else {
		this.sender = true; 
		this.result.text('your turn'); 
	}
	
	this.TTT.on('change', '.block input', this.oneStep.bind(this))
	.on('click', '.result input', this.restart.bind(this));
	
	socket.on('sender turn', this.playerTurn.bind(this));
	socket.on('receiver turn', this.playerTurn.bind(this));
};

Game.prototype.playerTurn = function(data) {
	var eventBlock = $($('.TTT').find('.block').get(data.position));
	var circle = 1;
	var cross = -1;
	if(!data.circle) {
		var cloneCross = $(".hidden-cross").clone();
		cloneCross.attr("class", "cross");
		cloneCross.appendTo(eventBlock);
		this.board[data.position] = cross;
	}
	else {
		var cloneCircle = $(".hidden-circle").clone();
		cloneCircle.attr("class", "circle");
		cloneCircle.appendTo(eventBlock);
		this.board[data.position] = circle;
	}
	
	var board = this.TTT.find(".board");
	var boardInput = board.find("input");
	var finished = this.isFinished(this.sender, data.position, board);
	if(!finished) {
		this.steps = data.steps + 1;
		
		if(this.sender) {
			if(this.steps & 1) { 
				this.result.text(this.players.receiver.username + "'s turn");
				boardInput.prop('disabled', true);
			}
			else { 
				this.result.text('your turn'); 
				boardInput.prop('disabled', false);
			}
		}
		else {
			if(this.steps & 1) {
				this.result.text('your turn');
				boardInput.prop('disabled', false);
				
			}
			else {
				this.result.text(this.players.receiver.username + "'s turn");
				boardInput.prop('disabled', true);
			}
		}
	}
	else {
		var closestBoard = board;
		closestBoard.addClass('finish');
		closestBoard.find('input').each(function() {
			if($(this).prop('disabled') === false) $(this).prop('disabled', true);
		});
	}
};

Game.prototype.oneStep = function(event) {
	var eventTarget = $(event.target);
	var eventBlock = $(event.target).parent('.block');
	var boardInput = this.TTT.find('.board input');
	eventBlock.find('input').prop('disabled', true);
	eventBlock.css('pointer-events', 'none');
	
	var circle = 1;
	var cross = -1;
	
	var blockIndex = eventBlock.closest(".board").find(".block").index(eventBlock);
	if(this.steps & 1) {
		var cloneCross = $(".hidden-cross").clone();
		cloneCross.attr("class", "cross");
		cloneCross.appendTo(eventBlock);
		this.board[blockIndex] = cross;
		this.socket.emit('receiver turn', {players: this.players, position: blockIndex, steps: this.steps, circle: false});
	}
	else {
		var cloneCircle = $(".hidden-circle").clone();
		cloneCircle.attr("class", "circle");
		cloneCircle.appendTo(eventBlock);
		this.board[blockIndex] = circle;
		this.socket.emit('sender turn', {players: this.players, position: blockIndex, steps: this.steps, circle: true});
	}
	
	var finished = this.isFinished(this.sender, blockIndex, eventTarget.closest(".board"));
	if(!finished) {
		this.steps += 1;
		
		if(this.sender) {
			if(this.steps & 1) { 
				this.result.text(this.players.receiver.username + "'s turn");
				boardInput.prop('disabled', true);
			}
			else { 
				this.result.text('your turn'); 
				boardInput.prop('disabled', false);
			}
		}
		else {
			if(this.steps & 1) {
				this.result.text('your turn');
				boardInput.prop('disabled', false);
			}
			else {
				this.result.text(this.players.receiver.username + "'s turn");
				boardInput.prop('disabled', true);
			}
		}
	}
	else {
		var closestBoard = eventTarget.closest(".board");
		closestBoard.addClass("finish");
		closestBoard.find("input").each(function() {
			if($(this).prop("disabled")===false) $(this).prop("disabled", "true");
		});
	}
};

Game.prototype.restart = function(event) {
	var board = $(event.target).closest('.game').find('.board');
	this.steps = 0;
	this.board.forEach(function(val, i, array) {
		array[i] = 0;
	});
	board.closest('.game').find('h2').html('&nbsp;');
	board.html($('.hidden').find(".board").children().clone());
	board.removeClass('finish');
};

Game.prototype.isFinished = function (sender, blockIndex, boardSelector) {
	var sum = 0;
	for(var i = 0; i < this.winArr[blockIndex].length; i += 2) {
		sum = this.board[blockIndex] + 
				  this.board[this.winArr[blockIndex][i]] +
				  this.board[this.winArr[blockIndex][i + 1]];
		if(sum === -3 || sum === 3) {
			if(sum === -3) {
				if(sender) {
					boardSelector.closest('.game').find('h2').text('Sorry, you lose!');
					this.socket.emit('lose game', {username: this.players.sender.username, socketId: this.socket.id});
				}
				else {
					boardSelector.closest('.game').find('h2').text('Cong! you win!');
					this.socket.emit('win game', {username: this.players.receiver.username, socketId: this.socket.id});
				}
			}
			if(sum === 3) {
				if(sender) {
					boardSelector.closest('.game').find('h2').text('Cong! you win!');
					this.socket.emit('win game', {username: this.players.sender.username, socketId: this.socket.id});
				}
				else {
					boardSelector.closest('.game').find('h2').text('Sorry, you lose!');
					this.socket.emit('lose game', {username: this.players.receiver.username, socketId: this.socket.id});
				}
			}
			var $block = boardSelector.find('.block');
			$($block.get(blockIndex)).find('svg').css('stroke', 'red');
			$($block.get(this.winArr[blockIndex][i])).find('svg').css('stroke', 'red');
			$($block.get(this.winArr[blockIndex][i + 1])).find('svg').css('stroke', 'red');
			return true;
		}
	}
	if(8 <= this.steps) {
		if(sender) this.socket.emit('draw game', {username: this.players.sender.username, socketId: this.socket.id});
		else this.socket.emit('draw game', {username: this.players.receiver.username, socketId: this.socket.id});
		boardSelector.closest('.game').find('h2').text('draw');
		return true;
	}
	return false;
};

var RunTicTacToe = function(socket, user) {
	this.usersArray = [];
    this.client = user;
    this.client.socketId = socket.id;
    this.game = null;
    this.socket = socket;
    
    this.switchInput = $('.switch input');
    this.switch = $('.switch');
    this.signUp = $('#sign-up');
    this.logIn = $('#log-in');
    this.playersUl = $('#players-ul');
    this.playersLi;
    this.players = $('#players');
    this.gameTitle = $('.game h1');
    
    this.switchInput.prop('checked', true);
    this.switch.css('pointer-events', 'auto');
    this.signUp.hide();
    this.logIn.hide();
    
    this.switchInput.click(this.switchInputonClick.bind(this));
	this.players.on('click', this.playersonClick.bind(this));
	
    this.socket.emit('add user', {username: user.username});
	this.socket.emit('get usersArray');
	    
	this.socket.on('get usersArray', this.getUsersArray.bind(this));
	this.socket.on('user joined', this.getUsersArray.bind(this));
	this.socket.on('user left', this.getUsersArray.bind(this));
	this.socket.on('request to play', this.requestToPlay.bind(this));
	this.socket.on('response from receiver', this.responseFromReceiver.bind(this));
};

RunTicTacToe.prototype.getUsersArray = function(data) {
	var ul = this.playersUl;
	ul.children().remove('li');
	this.usersArray = this.showList(ul, data);
	this.playersLi = $('#players li');
};

RunTicTacToe.prototype.requestToPlay = function(data) {
	var accept = confirm(data.sender.username + ' wants to play with you, do you accept?');
	if (accept === true) {
		this.socket.emit('response from receiver', {sender: data.sender, receiver: data.receiver, accept: true});
		for(var i = 0; i < this.usersArray.length; i++) {
			if(this.usersArray[i].socketId === data.sender.socketId) {
	        	this.usersArray[i].state = 'busy';
	        	this.gameTitle.text('playing with ' + data.sender.username);
	        	$(this.playersLi.get(i)).find('.state').toggleClass('green').addClass('red');
			}
        }
		this.game = new Game(this.socket, data, 1);
	} else {
		this.socket.emit('response from receiver', {sender: data.sender, receiver: data.receiver, accept: false});
	}
};

RunTicTacToe.prototype.responseFromReceiver = function(data) {
	if(data.accept) {
        this.game = new Game(this.socket, data, 0);
        for(var i = 0; i < this.usersArray.length; i++) {
        	if(this.usersArray[i].socketId === data.receiver.socketId) {
	        	this.usersArray[i].state = 'busy';
	        	this.gameTitle.text('playing with ' + data.receiver.username);
	        	$(this.playersLi.get(i)).find('.state').toggleClass('green').addClass('red');
			}
        }
    }
	else {alert(data.receiver.username + 'is busy!')};
};

RunTicTacToe.prototype.switchInputonClick = function(event) {
	var logOut = event.target;
	if(!logOut.checked) {
		this.socket.emit('log out');
		this.logIn.show();
		this.switch.css('pointer-events', 'none');
	}
	else this.switch.css('pointer-events', 'auto');
};

RunTicTacToe.prototype.playersonClick = function(event) {
	var player = this.usersArray[this.playersLi.index($(event.target).closest('li'))];
	if(player.state === 'available') {
		this.socket.emit('send game request', {
			sender: {username: this.client.username}, 
			receiver: {username: player.username, socketId: player.socketId}
		});
	}
	else console.log(player.username + 'is playing');	
};

RunTicTacToe.prototype.showList = function(ul, data) {
	var stateCircle;
	for(var i = 0; i < data.length; i++) {
		var user = data[i];
		if(user.socketId === this.client.socketId) {
			data.splice(i, 1); 
			i--;
			continue;
		}
		if(user.state === 'available') {
		    stateCircle = '<div class="green state"></div>';
		}
		if(user.state === 'playing') {
			stateCircle = '<div class="red state"></div>';
		}
		ul.append('<li>' + stateCircle + '<a>' + user.username + '</a></li>');
	}
	return data;
};

function userLogin(username, password, type) {
	var socket = io();
		
	var user = {username: username, type: type, password: password};
	socket.emit('authentication', user);
		
	socket.on('authenticated', () => {
		console.log('User authentictaed!');
		var runTicTacToe = new RunTicTacToe(socket, user);
	});
	
	socket.on('unauthorized', () => {
		console.log('User not authorized!');
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
});
