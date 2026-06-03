const driver = require("../config/neo4j");
const { toIsoString } = require("../utils/neoTime");

const num = (v) =>
  v && typeof v === "object" && "low" in v ? v.low : Number(v) || 0;

// GET /api/recommendations/people
// "People you may know": friends-of-people-you-follow that you don't yet
// follow, ranked by how many mutual connections you share (2-hop FOLLOWS).
const peopleYouMayKnow = async (req, res) => {
  const uid = req.user.uid;
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {uid:$uid})-[:FOLLOWS]->(mutual:User)-[:FOLLOWS]->(cand:User)
      WHERE cand <> me AND NOT (me)-[:FOLLOWS]->(cand)
      RETURN cand.uid AS uid, cand.name AS name,
             cand.photoURL AS photoURL,
             coalesce(cand.interests, []) AS interests,
             count(DISTINCT mutual) AS mutuals
      ORDER BY mutuals DESC, cand.name
      LIMIT 10
      `,
      { uid }
    );
    res.json(
      result.records.map((r) => ({
        uid: r.get("uid"),
        name: r.get("name"),
        photoURL: r.get("photoURL"),
        interests: r.get("interests"),
        mutuals: num(r.get("mutuals")),
      }))
    );
  } catch (error) {
    console.error("peopleYouMayKnow failed:", error.message);
    res.status(503).json({ error: "Recommendations unavailable", users: [] });
  } finally {
    await session.close();
  }
};

// GET /api/recommendations/interests
// Users (not already followed) who share the most interests with you.
const interestMatches = async (req, res) => {
  const uid = req.user.uid;
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (me:User {uid:$uid})
      MATCH (cand:User)
      WHERE cand <> me AND NOT (me)-[:FOLLOWS]->(cand)
      WITH cand,
           [i IN coalesce(me.interests, [])
              WHERE i IN coalesce(cand.interests, [])] AS common
      WHERE size(common) > 0
      RETURN cand.uid AS uid, cand.name AS name,
             cand.photoURL AS photoURL,
             coalesce(cand.interests, []) AS interests,
             common, size(common) AS overlap
      ORDER BY overlap DESC, cand.name
      LIMIT 10
      `,
      { uid }
    );
    res.json(
      result.records.map((r) => ({
        uid: r.get("uid"),
        name: r.get("name"),
        photoURL: r.get("photoURL"),
        interests: r.get("interests"),
        commonInterests: r.get("common"),
        overlap: num(r.get("overlap")),
      }))
    );
  } catch (error) {
    console.error("interestMatches failed:", error.message);
    res.status(503).json({ error: "Recommendations unavailable", users: [] });
  } finally {
    await session.close();
  }
};

// GET /api/recommendations/trending
// Posts from the last 24h ranked by like count.
const trendingPosts = async (req, res) => {
  const uid = req.user.uid;
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (author:User)-[:POSTED]->(p:Post)
      WHERE p.timestamp >= datetime() - duration('P1D')
      OPTIONAL MATCH (p)<-[:LIKED]-(l:User)
      WITH author, p, count(l) AS likeCount
      MATCH (me:User {uid:$uid})
      RETURN p, author.uid AS authorUid, author.name AS authorName,
             author.photoURL AS authorPhotoURL, likeCount,
             EXISTS { (me)-[:LIKED]->(p) } AS isLiked,
             EXISTS { (me)-[:FOLLOWS]->(author) } AS isFollowing
      ORDER BY likeCount DESC, p.timestamp DESC
      LIMIT 20
      `,
      { uid }
    );
    res.json(
      result.records.map((r) => {
        const p = r.get("p").properties;
        return {
          id: p.id,
          content: p.content,
          imageUrl: p.imageUrl,
          timestamp: toIsoString(p.timestamp),
          likeCount: num(r.get("likeCount")),
          isLiked: r.get("isLiked"),
          author: {
            uid: r.get("authorUid"),
            name: r.get("authorName"),
            photoURL: r.get("authorPhotoURL"),
            isFollowing: r.get("isFollowing"),
          },
        };
      })
    );
  } catch (error) {
    console.error("trendingPosts failed:", error.message);
    res.status(503).json({ error: "Trending unavailable", posts: [] });
  } finally {
    await session.close();
  }
};

module.exports = { peopleYouMayKnow, interestMatches, trendingPosts };
