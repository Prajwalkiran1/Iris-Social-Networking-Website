const driver = require("../config/neo4j");

// Search users by name or email
exports.searchUsers = async (req, res) => {
  const session = driver.session();
  const { q } = req.query;

  try {
    let result;
    if (!q || q.trim() === "") {
      // If no query, return all users (limited)
      result = await session.run(
        `
        MATCH (u:User)
        RETURN u
        ORDER BY u.name
        LIMIT 10
        `
      );
    } else {
      // Search by name or email
      result = await session.run(
        `
        MATCH (u:User)
        WHERE toLower(u.name) CONTAINS toLower($query) 
           OR toLower(u.email) CONTAINS toLower($query)
        RETURN u
        ORDER BY u.name
        LIMIT 20
        `,
        { query: q }
      );
    }

    const users = result.records.map((r) => r.get("u").properties);
    res.json(users);
  } catch (e) {
    console.error("User search failed:", e.message);
    res.status(503).json({ error: "Search temporarily unavailable", users: [] });
  } finally {
    await session.close();
  }
};

// Search users by interest based on the array property `u.interests`,
// which is how interests are stored in the profile routes.
exports.searchByInterest = async (req, res) => {
  const session = driver.session();
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Interest required" });
  }

  try {
    const result = await session.run(
      `
      MATCH (u:User)
      WHERE toLower($interest) IN u.interests
      RETURN u
      ORDER BY u.name
      LIMIT 20
      `,
      { interest: q.toLowerCase() }
    );

    const users = result.records.map((r) => r.get("u").properties);
    res.json(users);
  } catch (e) {
    console.error("Interest search failed:", e.message);
    res.status(503).json({ error: "Search temporarily unavailable", users: [] });
  } finally {
    await session.close();
  }
};