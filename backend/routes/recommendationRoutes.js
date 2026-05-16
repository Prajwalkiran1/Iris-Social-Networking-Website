const express = require("express");
const router = express.Router();
const {
  peopleYouMayKnow,
  interestMatches,
  trendingPosts,
} = require("../controllers/recommendationController");

// Actor uid is taken from the verified token (see verifyToken mount).
router.get("/people", peopleYouMayKnow);
router.get("/interests", interestMatches);
router.get("/trending", trendingPosts);

module.exports = router;
