var express = require('express');
var app = express();
var http = require("http").Server(app);		// function handler to be supplied to the http server
var io = require("socket.io")(http);		// initialize the instance by passing server object
var clients = new Array();
var AsteriskManager = require('asterisk-manager');
var ami = new AsteriskManager("5038", "192.168.0.99", "admin", "admin", true);

app.use(express.static(__dirname));		// allows to render static files on the html like css or js

app.get("/", function(req, res) {		// '/' - route handler that gets called when we hit the website home
//	res.send("hello world");
	res.sendFile(__dirname + "/index.html");
});

ami.on('close', function(e) {
	console.log("Asterisk closed");
});

ami.on('disconnect', function(e) {
	console.log("Asterisk disconnected");
});

ami.on('peerentry', function(e, res) {
	console.log(e);
});

ami.on('newstate', function(e, res) {
	console.log(e);
});

ami.on('peerstatus', function(e, res) {
	console.log("peerstatus" + e);
});

ami.on('connect', function(e) {
	console.log("Asterisk connected");
	
	ami.action({
	  'action':'SIPPeers'
	}, function(err, res) {
		console.log(res);
	});
});

io.on("connection", function(socket) {
	console.log("a user connected. ID = " + socket.id);
	
	socket.on("authenticate", function(data) {
		//console.log("auth email: " + data.email);
		var auth_array = new Array();
		auth_array.push(data.email);
		auth_array.push(socket.id);
		//auth_array.push(socket);	// for objects
		if (clients.length == 0) {
			clients.push(auth_array);
			io.to(socket.id).emit('authenticate', 'Authenticated: ' + data.email);	// using socket id
		} else {
			for (var i = 0; i < clients.length; i++) {
				if (clients[i][0] == data.email) {
					io.to(socket.id).emit('authenticate', 'Authenticated User already exists');	// using socket id
					break;
				} else if (i == clients.length - 1) {
					clients.push(auth_array);
					io.to(socket.id).emit('authenticate', 'Authenticated: ' + data.email);	// using socket id
					break;
				}
			}
		}
	});

	socket.on("message", function(data) {
		//console.log("message: " + data.msg);
		//console.log("from email: " + data.fromemail);
		//console.log("to email: " + data.toemail);
		for (var i = 0; i < clients.length; i++) {
			console.log(clients[i][0]);
			if (clients[i][0] == data.toemail) {
				io.to(clients[i][1]).emit('message', data.msg);
				//clients[i][1].emit('message', data.msg);	// for objects
				break;
			} else if (i == clients.length - 1) {
				io.to(socket.id).emit('message', 'User ' + data.toemail + " doesn't exist");
				break;
			}
		}
	});
	
	setInterval(function(){
		io.emit('user-list', clients);	// message to all the users
	}, 5000);
	
	socket.on("disconnect", function() {
		console.log("user disconnected");
		for (var i = 0; i < clients.length; i++) {
			if (clients[i][1] == socket.id) {
				io.emit('message', clients[i][0] + " logged out.");
				clients.splice(i, 1);
			}
		}
	});
});

http.listen(3000, function() {
	console.log("listening on port 3000");
});
