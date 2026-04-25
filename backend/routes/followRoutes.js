const express = require("express");
const { toggleFollow, checkFollowStatus, getFollowerCounts, getFollowersList, getFollowingList } = require("../controllers/followController");

const router = express.Router();

// Check follow status
router.get("/status/:followerUid/:followingUid", checkFollowStatus);

// Get follower counts
router.get("/counts/:userId", getFollowerCounts);

// Get followers list
router.get("/followers/:userId", getFollowersList);

// Get following list
router.get("/following/:userId", getFollowingList);

// Single endpoint to handle follow / unfollow behaviour.
// The controller inspects the existing relationship and either
// creates or deletes it accordingly.
router.post("/", toggleFollow);

module.exports = router;