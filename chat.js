var $ = require("jquery");
var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var user_list = new Array();

app.get("/", function(req, res) {
//	res.send("<h1>Hello Node</h1>");
	res.sendFile(__dirname + "/chat.html");
});

io.on("connection", function(socket) {
	console.log("a user connected");

	socket.on("authenticate", function(data) {
		console.log(data.email + '-' + socket.id);
		var data_array = new Array();
		data_array[0] = data.email;
		data_array[1] = socket.id;
		
		if (user_list.length == 0) {
			user_list.push(data_array);
			io.to(socket.id).emit("notify", "User: " + data.email + " is successfully authenticated.");
		} else {
			for (var i = 0; i < user_list.length; i++) {
				if (user_list[i][0] == data.email) {
					io.to(socket.id).emit("notify", "User: " + data.email + " already exists.");
					break;
				} else if (i == user_list.length - 1) {
					user_list.push(data_array);
					io.to(socket.id).emit("notify", "User: " + data.email + " is successfully authenticated.");
					break;
				}
			}
		}
	});
	
	setInterval(function() {
		io.emit("online-user-list", user_list);
	}, 5000);
	
	socket.on("chat_message", function(msg) {
		console.log(msg);
		io.emit("chat_message", msg);
	});

	socket.on("disconnect", function() {
		console.log("a user disconnected");
		for (var i = 0; i < user_list.length; i++) {
			if (user_list[i][1] == socket.id) {
				io.emit("notify", "User " + user_list[i][0] + " logged out.");
				user_list.splice(i, 1);
			}
		}
	});
});

http.listen("3000", function() {
	console.log("Listening on * 3000");
});
