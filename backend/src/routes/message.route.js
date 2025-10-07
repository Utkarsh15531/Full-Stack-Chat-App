import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  addReaction,
  removeReaction,
  editMessage,
  deleteMessage,
  markAsRead,
  getUnreadCounts
} from "../controllers/message.controller.js";


const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

// Message reactions
router.post("/:messageId/reaction", protectRoute, addReaction);
router.delete("/:messageId/reaction", protectRoute, removeReaction);

// Message editing and deletion
router.put("/:messageId/edit", protectRoute, editMessage);
router.delete("/:messageId", protectRoute, deleteMessage);

// Mark messages as read
router.put("/read/:id", protectRoute, markAsRead);

// Get unread counts
router.get("/unread/counts", protectRoute, getUnreadCounts);


export default router;