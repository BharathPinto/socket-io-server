const app = require("express")();
const http = require("http").createServer(app);
// const service = require("./ServiceHelper");
// var cors = require("cors");
var UserList = [];

// app.use(cors());

app.get("/", function (req, res) {
  res.send("<h1>Server is running...</h1>");
});

const io = require("socket.io")(http);

// const io = require("socket.io")(http, {
//   cors: {
//     origin: "http://localhost",
//     methods: ["GET", "POST"],
//   },
// });

io.on("connection", function (socket) {
  console.log("Client Connected:" + socket.id);

  socket.on("go-online", function (userDetail) {
    
    console.log("Request",userDetail);
    userDetail.SocketId = socket.id;
    console.log("UserDetail Socket",userDetail.SocketId);
    if (UserList.filter((e) => e.UserId === userDetail.UserId).length == 0) {
      UserList.push(userDetail);
      console.log("UserList"+ UserList);
    }

    console.log("UserList Length: " + UserList.length);

    socket.broadcast.emit("new-user", userDetail);
    socket.emit("online-users", [...UserList]);
  });

  // socket.emit("hello",socket.id);
  socket.on("hi", name => {
    socket.emit("hello", `hi ${name}, You are connected to the server`);
  });

  socket.on("message", function (data) {
    for (var i = 0; i < UserList.length; i++) {
      console.log(UserList[i].UserId+"-"+data.UserId);
      if (UserList[i].UserId == data.ReceiverId) {   
        console.log("Recever Id", data.ReceiverId);
        console.log("Sent message to Socket IO" , UserList[i].SocketId);
        // service.SaveMessage(data.Token, {
        //   SenderId: data.SenderId,
        //   ReceiverId: data.ReceiverId,
        //   Message: data.MessageData,
        //   UpdatedOn: data.TimeStamp
        // });     
        io.to(UserList[i].SocketId).emit("message", data);        
        break;
      }
    }
  });

  socket.on('connect_error', (err) =>{
      console.log(err);
      console.log("Connection Error");
  });

  socket.on("typing", function (data) {
    socket.broadcast.emit("typing", data);
  });

  socket.on("new-group", function (data) {
    socket.broadcast.emit("new-group", data);
  });

  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
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
  console.log("listening on *:3000");
});
