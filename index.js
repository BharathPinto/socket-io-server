const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
var UserList = [];


app.get('/', function (req, res) {
  res.send('<h1>Server is running...</h1>');
});

io.on('connection', function (socket) {
  console.log("Server Connected");
  socket.on("go-online", function (userDetail) {
    userDetail.SocketId = socket.id;

    if (UserList.filter((e) => e.UserId === userDetail.UserId).length == 0) {
      UserList.push(userDetail);
    }

    console.log("UserList Length: " + UserList.length);

    socket.broadcast.emit("new-user", userDetail);
    socket.emit("online-users", [...UserList]);
  });

  // when the client emits 'new message', this listens and executes
  socket.on('message', function (data) {
          console.log(data);
         console.log("new message");
        // we tell the client to execute 'new message'
        io.emit('message', "hello");
   
  });

  socket.on('connect_error', (err) =>{
    console.log(err);
    console.log("Connection Error");
});

socket.on("typing", function (data) {
  console.log(data);
  io.emit("typing", data);
});

socket.on("stop typing", function (data) {
  console.log("Stop typing");
  io.emit("stop typing",data);
});


socket.on("new-group", function (data) {
  socket.broadcast.emit("new-group", data);
});

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      // the disconnection was initiated by the server, you need to reconnect manually
      socket.connect();
      UserList = [];
    }
    
    for (var i = 0; i < UserList.length; i++) {
      if (UserList[i].SocketId === socket.id) {
        console.log("User Disconnected - " + UserList[i].UserName);
        UserList.splice(i, 1);
        socket.broadcast.emit("online-users", [...UserList]);
        console.log("UserList Length: " + UserList.length);
      }
    }
  });

});

http.listen(3000, function () {
  console.log('listening on *:3000');
});