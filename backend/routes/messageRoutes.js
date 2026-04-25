const express = require("express");
const router = express.Router();
const { sendMessage, getChat, getAllConversations } = require("../controllers/messageController");

router.get("/test", (req, res) => {
  res.send("Message routes working");
});

router.post("/send", sendMessage);
router.get("/chat/:friendId", getChat);
router.get("/conversations/:userId", getAllConversations);

module.exports = router;