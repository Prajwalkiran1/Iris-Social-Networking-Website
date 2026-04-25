const driver = require("../config/neo4j");

// Search users by name or email
exports.searchUsers = async (req, res) => {
  const session = driver.session({ database: "irisdb" });
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
    console.error("User search error, using mock data:", e);
    // Fallback mock data
    const mockUsers = q ? [
      { uid: "mock-1", name: "Mock User 1", email: "mock1@example.com", interests: ["tech", "music"] },
      { uid: "mock-2", name: "Mock User 2", email: "mock2@example.com", interests: ["art", "travel"] }
    ] : [
      { uid: "demo-1", name: "Alice", email: "alice@example.com", interests: ["music", "travel"] },
      { uid: "demo-2", name: "Bob", email: "bob@example.com", interests: ["tech", "sports"] },
      { uid: "demo-3", name: "Carol", email: "carol@example.com", interests: ["art", "photography"] },
      { uid: "demo-4", name: "David", email: "david@example.com", interests: ["cooking", "fitness"] },
      { uid: "demo-5", name: "Eva", email: "eva@example.com", interests: ["fashion", "movies"] }
    ];
    res.json(mockUsers);
  } finally {
    await session.close();
  }
};

// Search users by interest based on the array property `u.interests`,
// which is how interests are stored in the profile routes.
exports.searchByInterest = async (req, res) => {
  const session = driver.session({ database: "irisdb" });
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
    console.error(e);
    res.status(500).json({ error: "Interest search failed" });
  } finally {
    await session.close();
  }
};