const driver = require("../config/neo4j");

// CHECK FOLLOW STATUS
const checkFollowStatus = async (req, res) => {
  const followerUid = req.user.uid;
  const { followingUid } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (a:User {uid:$followerUid})-[r:FOLLOWS]->(b:User {uid:$followingUid})
      RETURN r IS NOT NULL AS isFollowing
      `,
      { followerUid, followingUid }
    );

    const isFollowing = result.records.length > 0 && result.records[0].get('isFollowing');
    
    res.status(200).json({ isFollowing });
  } catch (error) {
    console.error("checkFollowStatus failed:", error.message);
    res.json({ isFollowing: false });
  } finally {
    await session.close();
  }
};

// TOGGLE FOLLOW (follow/unfollow)
const toggleFollow = async (req, res) => {
  const followerUid = req.user.uid;
  const { followingUid } = req.body;

  if (!followingUid || followingUid === followerUid) {
    return res.status(400).json({ error: "Invalid target user" });
  }

  const session = driver.session();

  try {
    const check = await session.run(
      `
      MATCH (a:User {uid:$followerUid})-[r:FOLLOWS]->(b:User {uid:$followingUid})
      RETURN r
      `,
      { followerUid, followingUid }
    );

    if (check.records.length > 0) {
      await session.run(
        `
        MATCH (a:User {uid:$followerUid})-[r:FOLLOWS]->(b:User {uid:$followingUid})
        DELETE r
        `,
        { followerUid, followingUid }
      );

      return res.json({ message: "Unfollowed user" });
    } else {
      await session.run(
        `
        MATCH (a:User {uid:$followerUid}), (b:User {uid:$followingUid})
        CREATE (a)-[:FOLLOWS]->(b)
        `,
        { followerUid, followingUid }
      );

      return res.json({ message: "Followed user" });
    }
  } catch (error) {
    console.error("toggleFollow failed:", error.message);
    res.status(503).json({ error: "Follow service unavailable" });
  } finally {
    await session.close();
  }
};

// GET FOLLOWER COUNTS
const getFollowerCounts = async (req, res) => {
  const { userId } = req.params;
  const session = driver.session();

  try {
    // Get followers count
    const followersResult = await session.run(
      `
      MATCH (u:User {uid:$userId})<-[:FOLLOWS]-(follower:User)
      RETURN count(follower) AS followersCount
      `,
      { userId }
    );

    // Get following count
    const followingResult = await session.run(
      `
      MATCH (u:User {uid:$userId})-[:FOLLOWS]->(following:User)
      RETURN count(following) AS followingCount
      `,
      { userId }
    );

    const followersCount = followersResult.records[0].get('followersCount').low || 0;
    const followingCount = followingResult.records[0].get('followingCount').low || 0;
    
    res.status(200).json({ 
      followers: followersCount,
      following: followingCount
    });
  } catch (error) {
    console.error("getFollowerCounts failed:", error.message);
    res.json({ followers: 0, following: 0 });
  } finally {
    await session.close();
  }
};

// GET FOLLOWERS LIST
const getFollowersList = async (req, res) => {
  const { userId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (follower:User)-[:FOLLOWS]->(u:User {uid:$userId})
      RETURN follower.uid AS uid, follower.name AS name, follower.email AS email
      `,
      { userId }
    );

    const followers = result.records.map(record => ({
      uid: record.get("uid"),
      name: record.get("name"),
      email: record.get("email")
    }));
    
    res.status(200).json(followers);
  } catch (error) {
    console.error("getFollowersList failed:", error.message);
    res.json([]);
  } finally {
    await session.close();
  }
};

// GET FOLLOWING LIST
const getFollowingList = async (req, res) => {
  const { userId } = req.params;
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (u:User {uid:$userId})-[:FOLLOWS]->(following:User)
      RETURN following.uid AS uid, following.name AS name, following.email AS email
      `,
      { userId }
    );

    const following = result.records.map(record => ({
      uid: record.get("uid"),
      name: record.get("name"),
      email: record.get("email")
    }));
    
    res.status(200).json(following);
  } catch (error) {
    console.error("getFollowingList failed:", error.message);
    res.json([]);
  } finally {
    await session.close();
  }
};

module.exports = { toggleFollow, checkFollowStatus, getFollowerCounts, getFollowersList, getFollowingList };