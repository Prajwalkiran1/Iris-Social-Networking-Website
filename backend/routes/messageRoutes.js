const express = require("express");
const router = express.Router();
const { sendMessage, getChat, getAllConversations } = require("../controllers/messageController");
const { writeLimiter } = require("../middleware/rateLimit");
const { validateMessage } = require("../middleware/validate");

// Sender / owner is always the authenticated user (from the token).
router.post("/send", writeLimiter, validateMessage, sendMessage);
router.get("/chat/:friendId", getChat);
router.get("/conversations", getAllConversations);

module.exports = router;
