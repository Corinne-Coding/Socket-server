const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let usersList = [];
// usersList pour stocker à chaque connexion l'id et le username de l'utilisateur

// Connection
io.on("connection", (socket) => {
  console.log(" ----------------- User connected ----------------- ");
  // console.log(socket.handshake.query);
  // socket.handshake.query => data envoyées lors de la connexion

  const { roomId, userName } = socket.handshake.query;

  // Join room
  socket.join(roomId);
  console.log(`----- ${userName} joined ${roomId} ------`);

  const clients = io.sockets.adapter.rooms.get(roomId);
  // io.sockets.adapter.rooms.get(roomId) => pour récupérer un objet Set avec les ids des users connectés dans la room
  // clients.size => nombre de users

  const tab = [];
  clients.forEach((value) => {
    tab.push(value);
  });

  // boucle pour renvoyer un tableau avec les ids des users, dans l'ordre de connexion

  // ajouter les données (userId + userName) dans le tableau usersList
  usersList.push({ userId: tab[tab.length - 1], userName });

  // Send usersList after connection of any user
  io.to(roomId).emit("usersList", usersList);

  // Send a connection message to all users except the sender
  socket.broadcast.emit("userConnection", {
    message: `${userName} just entered in ${roomId}`,
  });

  // Receive message
  socket.on("newChatMessage", (data) => {
    console.log(data);
    // Send the message to all users
    data.date = new Date();
    io.to(roomId).emit("newChatMessage", data);
  });

  // update usersList if a user disconnect
  socket.on("disconnect", function () {
    usersList = usersList.filter((elem) => elem.userId !== socket.id);
    io.to(roomId).emit("usersList", usersList);
  });
});

server.listen(4000, () => {
  console.log(`Server started and listening on port 4000`);
});
