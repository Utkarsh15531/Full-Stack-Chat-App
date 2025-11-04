import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://whatsweb-client.onrender.com",
    // origin: ["http://localhost:5173"],
    // origin: ["http://192.170.11.50:5173"],
    credentials: true, // <-- REQUIRED to send cookies/tokens
  },
});

// we r accessing socket it by giving user id as we have somewhere <i class="fas fa-bullseye-arrow"></i> constructed a map of userID corresponding to SocketId
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id);

  // Extract the user ID from the query, assuming the handshake includes it.
  const userId = socket.handshake.query.userId;

  // Attach userId to the socket object for easier access on subsequent events
  if (userId) {
    socket.userId = userId; // Store userId on the socket for logging/disconnection
    userSocketMap[userId] = socket.id;

    // Update user's online status
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date()
      });
      console.log(`[USER CONNECTED] User ID ${userId} mapped to socket ${socket.id}`);
    } catch (error) {
      console.log("Error updating user status on connect:", error);
    }
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle typing indicators (omitted for brevity, as they are correct)
  socket.on("typing", (data) => { /* ... */ });
  socket.on("stopTyping", (data) => { /* ... */ });

  // Handle call signaling (omitted for brevity, as they are correct)
  socket.on("initiateCall", async (data) => {
    const { receiverId, callType, callId } = data;
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      // Get caller info
      try {
        const caller = await User.findById(userId).select("-password");
        // Logging the outgoing call notification
        console.log(`[CALL NOTIFY] Sending incomingCall to ${receiverId} from ${userId}`);
        io.to(receiverSocketId).emit("incomingCall", {
          callId,
          callType,
          caller,
          timestamp: new Date()
        });
      } catch (error) {
        console.log("Error sending call notification:", error);
      }
    } else {
      // Receiver is offline
      console.log(`[CALL FAILED] Receiver ${receiverId} is offline. Informing ${userId}.`);
      socket.emit("callFailed", {
        reason: "User is offline"
      });
    }
  });

  socket.on("answerCall", (data) => { /* ... */ });
  socket.on("rejectCall", (data) => { /* ... */ });
  socket.on("endCall", (data) => { /* ... */ });

  // WebRTC signaling - ADDING DIAGNOSTIC LOGS

  // 1. OFFER (The first critical step)
  socket.on("offer", (data) => {
    const { receiverId, offer, callId } = data;
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      console.log(`[SDP SIGNAL] Forwarding OFFER to ${receiverId} (Call ID: ${callId}) from ${userId}`);
      io.to(receiverSocketId).emit("offer", {
        offer,
        callId,
        from: userId
      });
    } else {
      console.log(`[SDP SIGNAL FAIL] Cannot forward OFFER, receiver ${receiverId} not found.`);
    }
  });

  // 2. ANSWER
  socket.on("answer", (data) => {
    const { callerId, answer, callId } = data;
    const callerSocketId = getReceiverSocketId(callerId);

    if (callerSocketId) {
      console.log(`[SDP SIGNAL] Forwarding ANSWER to ${callerId} (Call ID: ${callId}) from ${userId}`);
      io.to(callerSocketId).emit("answer", {
        answer,
        callId,
        from: userId
      });
    }
  });

  // 3. ICE CANDIDATE
  socket.on("iceCandidate", (data) => {
    const { targetId, candidate, callId } = data;
    const targetSocketId = getReceiverSocketId(targetId);

    if (targetSocketId) {
      console.log(`[ICE SIGNAL] Forwarding candidate to ${targetId} (Call ID: ${callId}) from ${userId}`);
      io.to(targetSocketId).emit("iceCandidate", {
        candidate,
        callId,
        from: userId
      });
    }
  });

  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.id);

    if (socket.userId) { // Use socket.userId
      // Update user's last seen and offline status
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        });
      } catch (error) {
        console.log("Error updating user status on disconnect:", error);
      }

      delete userSocketMap[socket.userId];
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
