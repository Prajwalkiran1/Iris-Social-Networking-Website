const express = require("express");
const router = express.Router();
const db = require("../config/neo4j");
const { validatePost } = require("../middleware/validate");

router.post("/", validatePost, async (req, res) => {
  const { content, imageUrl } = req.body;
  const uid = req.user.uid;

  const session = db.session();
  try {
    const result = await session.run(
      `
      MERGE (u:User {uid: $uid})
      ON CREATE SET u.name = $name, u.email = $email,
                    u.bio = "", u.interests = [], u.createdAt = datetime()

      CREATE (p:Post {
        id: randomUUID(),
        content: $content,
        imageUrl: $imageUrl,
        timestamp: datetime(),
        likeCount: 0
      })

      CREATE (u)-[:POSTED]->(p)
      RETURN p, u
      `,
      {
        content,
        imageUrl: imageUrl || "",
        uid,
        name: req.user.name || "Anonymous",
        email: req.user.email || "",
      }
    );

    const record = result.records[0];
    res.json({
      id: record.get("p").properties.id,
      content,
      imageUrl: imageUrl || "",
      timestamp: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
      author: {
        uid,
        name: record.get("u").properties.name,
        isFollowing: false,
      },
    });
  } catch (err) {
    console.error("Post creation failed:", err.message);
    res.status(503).json({ error: "Posting temporarily unavailable" });
  } finally {
    await session.close();
  }
});

// POST /api/posts/:id/like — toggle like for a user on a post.
// Returns the authoritative { likeCount, isLiked } after the toggle.
router.post("/:id/like", async (req, res) => {
  const { id } = req.params;
  const uid = req.user.uid;

  const session = db.session();
  try {
    const result = await session.run(
      `
      MATCH (p:Post {id:$id})
      MERGE (u:User {uid:$uid})
      ON CREATE SET u.name = "Anonymous"
      WITH p, u, EXISTS { (u)-[:LIKED]->(p) } AS liked
      CALL {
        WITH p, u, liked
        WITH p, u, liked WHERE liked
        MATCH (u)-[r:LIKED]->(p) DELETE r
      }
      CALL {
        WITH p, u, liked
        WITH p, u, liked WHERE NOT liked
        MERGE (u)-[:LIKED]->(p)
      }
      WITH p, NOT liked AS isLiked
      OPTIONAL MATCH (p)<-[:LIKED]-(l:User)
      WITH p, isLiked, count(l) AS likeCount
      SET p.likeCount = likeCount
      RETURN likeCount, isLiked
      `,
      { id, uid }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const likeCount = result.records[0].get("likeCount");
    res.json({
      id,
      likeCount:
        likeCount && typeof likeCount === "object" && "low" in likeCount
          ? likeCount.low
          : Number(likeCount) || 0,
      isLiked: result.records[0].get("isLiked"),
    });
  } catch (err) {
    console.error("Like toggle failed:", err.message);
    res.status(503).json({ error: "Like service unavailable" });
  } finally {
    await session.close();
  }
});

module.exports = router;