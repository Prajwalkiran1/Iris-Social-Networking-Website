const express = require("express");
const router = express.Router();
const { getFeed } = require("../controllers/feedController");

// GET /api/feed — personalized feed for the authenticated user
// (uid is taken from the verified token in the controller).
router.get("/", getFeed);

module.exports = router;
