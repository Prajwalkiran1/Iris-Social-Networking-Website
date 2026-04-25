const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

router.get("/users", searchController.searchUsers);
router.get("/interests", searchController.searchByInterest);

module.exports = router;