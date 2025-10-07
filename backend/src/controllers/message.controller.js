import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } })
      .select("-password")
      .sort({ lastSeen: -1 }); // Sort by most recently seen

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).populate('replyTo').sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo, voiceMessage, voiceDuration, status } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let voiceUrl;
    if (voiceMessage) {
      try {
        // Upload base64 audio to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(voiceMessage, {
          resource_type: "video", // Cloudinary uses 'video' for audio files
          format: "webm" // Specify format for audio
        });
        voiceUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.log("Error uploading voice message:", uploadError);
        // Continue without voice message if upload fails
        voiceUrl = null;
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      voiceMessage: voiceUrl,
      voiceDuration: voiceDuration || 0,
      replyTo: replyTo || null,
      status: status || 'sent'
    });

    await newMessage.save();
    
    // Populate the replyTo field if it exists
    await newMessage.populate('replyTo');

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add reaction to message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      reaction => reaction.userId.toString() === userId.toString() && reaction.emoji === emoji
    );

    if (existingReaction) {
      return res.status(400).json({ error: "You already reacted with this emoji" });
    }

    // Remove any existing reaction from this user
    message.reactions = message.reactions.filter(
      reaction => reaction.userId.toString() !== userId.toString()
    );

    // Add new reaction
    message.reactions.push({ userId, emoji });
    await message.save();

    // Emit to both sender and receiver
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    
    const updateData = { messageId, reactions: message.reactions };
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageReactionUpdate", updateData);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReactionUpdate", updateData);
    }

    res.status(200).json({ message: "Reaction added successfully", reactions: message.reactions });
  } catch (error) {
    console.log("Error in addReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove reaction from message
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Remove user's reaction
    message.reactions = message.reactions.filter(
      reaction => reaction.userId.toString() !== userId.toString()
    );
    
    await message.save();

    // Emit to both sender and receiver
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    
    const updateData = { messageId, reactions: message.reactions };
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageReactionUpdate", updateData);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReactionUpdate", updateData);
    }

    res.status(200).json({ message: "Reaction removed successfully", reactions: message.reactions });
  } catch (error) {
    console.log("Error in removeReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    // Check if message is not older than 15 minutes (optional constraint)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(403).json({ error: "Message is too old to edit" });
    }

    message.text = text;
    message.editedAt = new Date();
    await message.save();

    // Emit to both sender and receiver
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageEdited", message);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    message.isDeleted = true;
    message.text = "This message was deleted";
    message.image = null;
    await message.save();

    // Emit to both sender and receiver
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", message);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", message);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params; // ID of the user whose messages we're marking as read
    const userId = req.user._id;

    // Find all unread messages from senderId to current user
    const messages = await Message.find({
      senderId: senderId,
      receiverId: userId,
      "readBy.userId": { $ne: userId }
    });

    // Mark all messages as read and update status
    await Message.updateMany(
      {
        senderId: senderId,
        receiverId: userId,
        "readBy.userId": { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId: userId,
            readAt: new Date()
          }
        },
        $set: { status: 'read' }
      }
    );

    // Emit read receipt to sender
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        readBy: userId,
        messageIds: messages.map(m => m._id)
      });
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.log("Error in markAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get unread message counts for all users
export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Aggregate unread counts by sender
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: userId,
          "readBy.userId": { $ne: userId }
        }
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to object format { userId: count }
    const counts = {};
    unreadCounts.forEach(item => {
      counts[item._id.toString()] = item.count;
    });
    
    res.status(200).json(counts);
  } catch (error) {
    console.log("Error in getUnreadCounts controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
