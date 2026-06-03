const express = require("express");
const router = express.Router();
const driver = require("../config/neo4j");
const { validateProfile } = require("../middleware/validate");

// GET /api/profile/:uid
router.get("/:uid", async (req, res) => {
  const { uid } = req.params;
  const session = driver.session();
  
  try {
    const result = await session.run(
      `MATCH (u:User {uid: $uid}) RETURN u`,
      { uid }
    );
    
    if (result.records.length === 0) {
      // Return mock data if user not found in Neo4j
      return res.json({
        uid,
        name: "Demo User",
        bio: "",
        interests: [],
        followers: 0,
        following: 0
      });
    }
    
    const raw = result.records[0].get("u").properties;
    const user = {
      ...raw,
      followers: raw.followers ? raw.followers.low ?? raw.followers : 0,
      following: raw.following ? raw.following.low ?? raw.following : 0,
    };

    res.json(user);
  } catch (error) {
    console.error("Profile fetch failed, using fallback:", error.message);
    // Fallback mock data
    res.json({
      uid,
      name: "Demo User",
      bio: "",
      interests: [],
      followers: 0,
      following: 0
    });
  } finally {
    await session.close();
  }
});

// PUT /api/profile/:uid
router.put("/:uid", validateProfile, async (req, res) => {
  const { uid } = req.params;
  if (uid !== req.user.uid) {
    return res.status(403).json({ error: "You can only edit your own profile" });
  }
  const { name, bio, interests, photoURL } = req.body;
  const session = driver.session();

  try {
    // photoURL is optional — only set it if the client sent it (including
    // explicit null to clear). Otherwise leave the existing value untouched.
    const setPhoto = Object.prototype.hasOwnProperty.call(req.body, "photoURL");
    await session.run(
      `MERGE (u:User {uid: $uid})
       SET u.name = $name, u.bio = $bio, u.interests = $interests` +
        (setPhoto ? `, u.photoURL = $photoURL` : ``),
      { uid, name, bio, interests, photoURL: photoURL ?? null }
    );
    
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update failed:", error.message);
    res.status(503).json({ error: "Profile update temporarily unavailable" });
  } finally {
    await session.close();
  }
});

module.exports = router;
