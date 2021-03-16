const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// Tab to store id & username of each connected user
let usersList = [];

// Tab to store id & username of each typing user
let typingList = [];

// Connection to WebSocket
io.on("connection", (socket) => {
  // Informations received when a user is connected
  const { roomId, userName } = socket.handshake.query;

  // Join room
  socket.join(roomId);

  // Get all connected users ids in a Set object
  const clients = io.sockets.adapter.rooms.get(roomId);
  console.log(clients);

  // Loop on clients variable to get a tab with all ids in connection order
  const tab = [];
  clients.forEach((value) => {
    tab.push(value);
  });

  // Add the last connected user in usersList variable
  usersList.push({ roomId, userId: tab[tab.length - 1], userName });

  // Send filtered usersList after connection of any user
  const tabToSend = usersList.filter((element) => element.roomId === roomId);
  io.to(roomId).emit("usersList", tabToSend);

  // Send a connection message to all users except the sender
  socket.to(roomId).broadcast.emit("userConnection", {
    newConnection: `${userName} has just entered ${roomId}`,
  });

  // Receive message
  socket.on("newChatMessage", (data) => {
    // Send the message to all users
    data.date = new Date();
    io.to(roomId).emit("newChatMessage", data);
  });

  // Receive isTyping event
  socket.on("isTyping", (data) => {
    // If user is typing, add it in typingList
    if (data.typing) {
      // search if userId is already in typingList or not
      let isPresent = false;
      typingList.forEach((element) => {
        if (element.userId === data.userId) {
          isPresent = true;
        }
      });
      // if not, add user in typingList
      if (!isPresent) {
        typingList.push({
          isTyping: data.typing,
          userId: data.userId,
          userName: data.userName,
        });
      }
    } else {
      // If user stopped typing, remove it from typingList
      typingList = typingList.filter(
        (element) => element.userId !== data.userId
      );
    }

    io.to(roomId).emit("isTyping", typingList);
  });

  // Disconnection from WebSocket
  socket.on("disconnect", function () {
    // Update and send usersList if a user disconnect
    usersList = usersList.filter((elem) => elem.userId !== socket.id);
    const tabToSend = usersList.filter((element) => element.roomId === roomId);
    io.to(roomId).emit("usersList", tabToSend);

    // Update and send typingList if a user disconnect
    typingList = typingList.filter((elem) => elem.userId !== socket.id);
    io.to(roomId).emit("isTyping", typingList);

    // Send a disconnection message to all users except the disconnected one
    socket.to(roomId).broadcast.emit("userDisconnection", {
      newDisconnection: `${userName} has just leaved ${roomId}`,
    });
  });
});

app.get("/", (req, res) => {
  res.send("Welcome on my Socket server");
});

server.listen(process.env.PORT || 4000, () => {
  console.log(`Server started and listening on port 4000`);
});
