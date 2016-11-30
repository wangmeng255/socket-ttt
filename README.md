# Socket Tic Tac Toe

Thinkful (https://www.thinkful.com) Portfolio Exercise - a game app built with socket-io, jQuery, and mongoose.

![Screenshot](https://github.com/wangmeng255/socket-ttt/blob/dev/images/tic-tac-toe-ini.png "Screenshot")

##Background

I am a game fun. I built this simple game to practice socket.io, mongoose, and passport. I think the project is also a prototype of Instant Messager app. And I want to add  an artificial intelligence algorithm in the server in the future.

##Use Case

Users can sign up, log in MongoDB, choose an online player to play. Server transfers informations between players, and interact with MongoDB to do users log in or sign up. If you wants to find an example to show how to use passport, socketio-auth, and mongoose model, this project helps you.

##How to Use

1. User needs to Login. If user doesn't have an account, user can sign up.

![tic tac toe login](https://github.com/wangmeng255/socket-ttt/blob/dev/images/tic-tac-toe-login.png "log in Tic Tac Toe")

2. User can click one user with green pot on the right side panel "Players online", app will send a request to the clicked user`

![tic tac toe request](https://github.com/wangmeng255/socket-ttt/blob/dev/images/tic-tac-toe-request.png "request Tic Tac Toe")

3. If the user accepted, two users start to play.

![tic tac toe playing](https://github.com/wangmeng255/socket-ttt/blob/dev/images/tic-tac-toe-playing.png "play Tic Tac Toe")

4. If one user won or the game was drawed, the game ends. And user can choose a user to play the game again. 

![tic tac toe win](https://github.com/wangmeng255/socket-ttt/blob/dev/images/tic-tac-toe-win.png "win Tic Tac Toe")

##Working Prototype

You can access a working prototype of the app here: (https://socket-tic-tac-toe.herokuapp.com/)

##Functionality

The app's main functionality: users can play a 3*3 blocks tic tac toe online.

* Server-side:
    1. Storing user data in MongoDB.
    2. Checking username and password when user logs in or signs up.
    3. Keeping online users list.
    4. Listening user's state and send users list to client-side.
    5. Listening user's play request.
    6. Listenging user's play input when user is playing.
    7. Listening user's log out or disconnection.

* Client-side: 
    1. Choosing an online user to play.
    2. Sending or receiving play request to a user and updating user's state.
    3. Listening opponent input and showing it.
    4. Showing game result.
    5. Sending disconnection and log out to server-side.


##Technical

The client-side in this app is built with jQuery and socket.io. The server-side in this app is built with mongoose, passport, and socketio-auth. The socket.io makes connections between client-side and server-side. Username and password are held in MongoDB. User list is held in memory during the user's session. It has been built to be fully responsive across mobile, tablet and desktop screen resolutions.

##Development Roadmap

This is v1.0 of the app, but future enhancements are expected to include:

* Adding playing vs computer with artificial intelligence in server-side.
* Adding win, lose, and draw records to user data in MongoDB.
* Adding Top 10 players list in client-side.
