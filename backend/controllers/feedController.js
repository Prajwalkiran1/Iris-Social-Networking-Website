const driver = require("../config/neo4j");

// GET FEED
const getFeed = async (req, res) => {
  const { uid } = req.params;
  const session = driver.session({ database: "irisdb" });

  try {
    // Get posts from users you follow AND your own posts
    const result = await session.run(
      `
      MATCH (u:User {uid:$uid})-[:FOLLOWS]->(f:User)-[:POSTED]->(p:Post)
      RETURN f.uid AS authorUid, f.name AS authorName, p
      
      UNION
      
      MATCH (u:User {uid:$uid})-[:POSTED]->(p:Post)
      RETURN u.uid AS authorUid, u.name AS authorName, p
      
      ORDER BY p.timestamp DESC
      LIMIT 50
      `,
      { uid }
    );

    const posts = result.records.map((record) => {
      const post = record.get("p").properties;
      const timestamp = post.timestamp;
      
      // Convert Neo4j datetime to ISO string
      let isoTimestamp;
      if (timestamp && typeof timestamp === 'object') {
        isoTimestamp = new Date(
          timestamp.year.low,
          timestamp.month.low - 1,
          timestamp.day.low,
          timestamp.hour.low,
          timestamp.minute.low,
          timestamp.second.low,
          timestamp.nanosecond.low / 1000000
        ).toISOString();
      } else if (timestamp) {
        isoTimestamp = timestamp.toString();
      } else {
        isoTimestamp = new Date().toISOString();
      }
      
      // Convert Neo4j Integer to regular number
      let likeCount = 0;
      if (post.likeCount) {
        if (typeof post.likeCount === 'object' && post.likeCount.low !== undefined) {
          likeCount = post.likeCount.low;
        } else {
          likeCount = Number(post.likeCount) || 0;
        }
      }
      
      const postData = {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        timestamp: isoTimestamp,
        originalTimestamp: timestamp, // Keep original for debugging
        likeCount: likeCount,
        isLiked: false, // TODO: Implement like status check
        author: {
          uid: record.get("authorUid"),
          name: record.get("authorName"),
          isFollowing: false // TODO: Implement follow status check
        }
      };
      
      console.log(`Post ${postData.id}: ${postData.timestamp} (original: ${timestamp})`);
      return postData;
    });

    // Additional sorting by ISO timestamp to ensure correct order
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  } finally {
    await session.close();
  }
};

module.exports = { getFeed };