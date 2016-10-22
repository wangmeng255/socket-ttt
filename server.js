var http = require('http');
var express = require('express');
var socket_io = require('socket.io');
var mongoose = require('mongoose');
var User = require('./user-model');

var config = require('./config');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

require('socketio-auth')(io, {
    authenticate: function (socket, data, callback) {
        console.log('authentication event was received!');
        //get credentials sent by the client
        var username = data.username;
        var password = data.password;
        
        if(data.type === 'log-in') {
            
            // fetch user and test password verification
            User.findOne({
                username: username
            }, function(err, user) {
                if(err) {
                    callback(err);
                    return;
                }
                
                if(!user) {
                    return callback(new Error('User not authenticated'));
                }
                
                user.validatePassword(password, function(err, isValid) {
                    console.log('user isValid: ', isValid);
                    if(err) {
                        return callback(new Error('User not authenticated'));
                    }
                    
                    if(!isValid) {
                        return callback(new Error('User not authenticated'));
                    }
                    
                    socket.username = username;
                    return callback(null, isValid);
                });
            });
        }
        
        if(data.type === 'sign-up') {
            var user = new User({
                username: username, 
                password: password
            });
            console.log('sign-up', user);
            user.save(function(err) {
                if (err) {
                    return callback(new Error('User not authenticated'));
                }

                return callback(null, true);
            });
        }
    }
});

var numUsers = 0;
var usersArray = [];
io.on('connection', function(socket){
    console.log('Client connected:', socket.id);
    
    var addedUser = false;
    socket.on('add user', function (user) {
        if (addedUser) return;

        // we store the username in the socket session for this client
        ++numUsers;
        socket.username = user.username;
        user.socketId = socket.id;
        user.state = 'available';
        usersArray.push(user);
        addedUser = true;
        
        console.log('add event received');
        
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', usersArray);
    });
    
    socket.on('get usersArray', function() {
        console.log('get usersArray');
        console.log('get usersArray:', usersArray);
        io.to(socket.id).emit('get usersArray', usersArray);
    });
    
    socket.on('send game request', function(data) {
        data.sender.socketId = socket.id;
        io.to(data.receiver.socketId).emit('request to play', data);
    });
    
    socket.on('response from receiver', function(data) {
        if(data.accept) {
            for(var i = 0; i < usersArray.length; i++) {
                if(usersArray[i].socketId === data.sender.socketId) {
                    usersArray[i].state = 'busy';
                    data.sender.state = 'busy';
                }
                if(usersArray[i].socketId === data.receiver.socketId) {
                    usersArray[i].state = 'busy';
                    data.receiver.state = 'busy';
                }
            }
        }
        console.log(usersArray);
        io.to(data.sender.socketId).emit('response from receiver', data);
    });
    
    socket.on('receiver turn', function(data) {
        console.log(data.receiver.username, 'receiver turn');
        io.to(data.players.sender.socketId).emit('receiver turn', data);
    });
    
    socket.on('sender turn', function(data) {
        console.log(data.sender.username, 'sender turn');
        io.to(data.players.receiver.socketId).emit('sender turn', data);
    });
    
    socket.on('lose game', function(data) {
        console.log(data.username + ' lose game');
        for(var i = 0; i < usersArray.length; i++) {
            if(usersArray[i].socketId === data.socketId) {
                usersArray[i].state = 'available';
                break;
            }
        }
        io.emit('get usersArray', usersArray);
    });
    
    socket.on('win game', function(data) {
        console.log(data.username + ' win game');
        for(var i = 0; i < usersArray.length; i++) {
            if(usersArray[i].socketId === data.socketId) {
                usersArray[i].state = 'available';
                break;
            }
        }
        io.emit('get usersArray', usersArray);
    });
    
    socket.on('draw game', function(data) {
        console.log(data.username + ' draw game');
        for(var i = 0; i < usersArray.length; i++) {
            if(usersArray[i].socketId === data.socketId) {
                usersArray[i].state = 'available';
                break;
            }
        }
        io.emit('get usersArray', usersArray);
    });
    
    socket.on('log out', function() {
        console.log('log out event received');
        if (addedUser) {
            --numUsers;
            for(var i = 0; i < usersArray.length; i++) {
                if(usersArray[i].socketId === socket.id) {
                    usersArray.splice(i, 1);
                    break;
                }
            }
            
            socket.broadcast.emit('user left', usersArray);
        }
    });
    
    socket.on('disconnect', function() {
        console.log('disconnect event received');
        if (addedUser) {
            --numUsers;
            for(var i = 0; i < usersArray.length; i++) {
                if(usersArray[i].socketId === socket.id) {
                    usersArray.splice(i, 1);
                    break;
                }
            }  
            socket.broadcast.emit('user left', usersArray);
        }
    });
});

var runServer = function(callback) {
    
    mongoose.connect(config.DATABASE_URL, function(err) {
        if(err && callback) {
            return callback(err);
        }
        
        server.listen(process.env.PORT || 8080, function() {
            console.log('server listening to ' + process.env.PORT || 8080);
            if(callback) {
                callback();
            }
        });
    });
};

if(require.main === module) {
    runServer(function(err) {
        if(err) {
            console.error(err);
        }
    });
}

exports.app = app;
exports.runServer = runServer;
