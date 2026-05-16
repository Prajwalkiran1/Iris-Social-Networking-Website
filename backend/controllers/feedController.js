const driver = require("../config/neo4j");
const { toIsoString } = require("../utils/neoTime");

const num = (v) =>
  v && typeof v === "object" && "low" in v ? v.low : Number(v) || 0;

// GET /api/feed/:uid — own posts + posts from people you follow,
// with real like counts and whether the requesting user liked each post.
const getFeed = async (req, res) => {
  const uid = req.user.uid;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (me:User {uid:$uid})
      MATCH (author:User)-[:POSTED]->(p:Post)
      WHERE author = me OR (me)-[:FOLLOWS]->(author)
      OPTIONAL MATCH (p)<-[:LIKED]-(liker:User)
      WITH me, author, p, count(liker) AS likeCount
      RETURN author.uid AS authorUid,
             author.name AS authorName,
             p,
             likeCount,
             EXISTS { (me)-[:LIKED]->(p) } AS isLiked,
             EXISTS { (me)-[:FOLLOWS]->(author) } AS isFollowing
      ORDER BY p.timestamp DESC
      LIMIT 50
      `,
      { uid }
    );

    const posts = result.records.map((record) => {
      const post = record.get("p").properties;
      return {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        timestamp: toIsoString(post.timestamp),
        likeCount: num(record.get("likeCount")),
        isLiked: record.get("isLiked"),
        author: {
          uid: record.get("authorUid"),
          name: record.get("authorName"),
          isFollowing: record.get("isFollowing"),
        },
      };
    });

    res.json(posts);
  } catch (error) {
    // Degrade gracefully like the other endpoints instead of leaking a 500.
    console.error("Feed unavailable, returning fallback:", error.message);
    res
      .status(503)
      .json({ error: "Feed temporarily unavailable", posts: [] });
  } finally {
    await session.close();
  }
};

module.exports = { getFeed };
