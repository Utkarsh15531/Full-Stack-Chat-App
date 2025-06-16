import { Server } from "socket.io";
import http from "http"; //http – used to convert/wraps the Express app into a raw HTTP server.
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  //CORS allows your frontend (running at localhost:5173) to connect to the backend WebSocket server.
  //Without CORS, the browser would block the frontend from connecting.
  cors: {
    origin: ["http://localhost:5173"],
  },
});

//we r accessing socket it by giving user id as we have somewhere <i class="fas fa-bullseye-arrow    "></i> constructed a map of userID corresponding to SocketId
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };