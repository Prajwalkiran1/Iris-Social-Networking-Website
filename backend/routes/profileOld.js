const express = require("express");
const router = express.Router();
const driver = require("../neo4j");

// GET /api/profile/:uid
router.get("/:uid", async (req, res) => {
  const { uid } = req.params;
  const session = driver.session({ database: "irisdb" });
  
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
    console.error("Profile fetch error, using mock data:", error);
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
router.put("/:uid", async (req, res) => {
  const { uid } = req.params;
  const { name, bio, interests } = req.body;
  const session = driver.session({ database: "irisdb" });
  
  try {
    await session.run(
      `MERGE (u:User {uid: $uid})
       SET u.name = $name, u.bio = $bio, u.interests = $interests`,
      { uid, name, bio, interests }
    );
    
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  } finally {
    await session.close();
  }
});

// PUT /api/profile/bio (legacy endpoint)
router.put("/bio", async (req, res) => {
  const { uid, bio } = req.body;
  const session = driver.session({ database: "irisdb" });
  try {
    await session.run(
      `MATCH (u:User {uid: $uid}) SET u.bio = $bio`,
      { uid, bio }
    );
    res.json({ message: "Bio updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update bio" });
  } finally {
    await session.close();
  }
});

module.exports = router;
           WHEN $interest IN existing
           THEN existing
           ELSE existing + $interest
         END`,
      { uid, interest }
    );
    res.json({ message: "Interest added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add interest" });
  } finally {
    await session.close();
  }
});

// PUT /api/profile/interests/remove
router.put("/interests/remove", verifyToken, async (req, res) => {
  const { uid, interest } = req.body;
  const session = driver.session({ database: "irisdb" });
  try {
    await session.run(
      `MATCH (u:User {uid: $uid})
       SET u.interests = [
         x IN coalesce(u.interests, [])
         WHERE x <> $interest
       ]`,
      { uid, interest }
    );
    res.json({ message: "Interest removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove interest" });
  } finally {
    await session.close();
  }
});

module.exports = router;