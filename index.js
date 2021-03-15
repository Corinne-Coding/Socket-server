const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// Tab to store id & username of each connected user
let usersList = [];

// Connection to WebSocket
io.on("connection", (socket) => {
  // Informations received when a user is connected
  const { roomId, userName } = socket.handshake.query;

  // Join room
  socket.join(roomId);

  const clients = io.sockets.adapter.rooms.get(roomId);

  // Loop on clients variable (Set object) to get a tab with all ids in connection order
  const tab = [];
  clients.forEach((value) => {
    tab.push(value);
  });

  // add the last connected user in usersList variable
  usersList.push({ userId: tab[tab.length - 1], userName });

  // Send usersList after connection of any user
  io.to(roomId).emit("usersList", usersList);

  // Send a connection message to all users except the sender
  socket.broadcast.emit("userConnection", {
    newConnection: `${userName} has just entered in ${roomId}`,
  });

  // Receive message
  socket.on("newChatMessage", (data) => {
    console.log(data);
    // Send the message to all users
    data.date = new Date();
    io.to(roomId).emit("newChatMessage", data);
  });

  // Update usersList if a user disconnect
  socket.on("disconnect", function () {
    usersList = usersList.filter((elem) => elem.userId !== socket.id);
    io.to(roomId).emit("usersList", usersList);
  });
});

server.listen(4000, () => {
  console.log(`Server started and listening on port 4000`);
});
