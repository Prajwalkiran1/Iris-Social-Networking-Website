const express = require("express");
const router = express.Router();
const { getFeed } = require("../controllers/feedController");

// Mock data for when Neo4j is not available
const mockPosts = [
  {
    id: "1",
    content: "Welcome to Iris! Your social networking platform.",
    imageUrl: null,
    likeCount: 5,
    timestamp: new Date().toISOString(),
    isLiked: false,
    author: {
      uid: "demo-user-1",
      name: "Demo User",
      isFollowing: false
    }
  },
  {
    id: "2",
    content: "This is a sample post to show how the feed works.",
    imageUrl: null,
    likeCount: 3,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isLiked: false,
    author: {
      uid: "demo-user-2",
      name: "Another User",
      isFollowing: false
    }
  }
];

// GET /api/feed/:uid - Get personalized feed for a user
router.get("/:uid", getFeed);

// GET /api/feed - Get all posts (fallback)
router.get("/", async (req, res) => {
  console.log("Using fallback feed endpoint");
  res.json(mockPosts);
});

module.exports = router;