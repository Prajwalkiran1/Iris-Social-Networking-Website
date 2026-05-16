const express = require("express");
const router = express.Router();
const driver = require("../config/neo4j");

// POST /api/auth/register
// Called after Firebase signup to save user in Neo4j
router.post("/register", async (req, res) => {
  // uid/email come from the verified token, never the client body.
  const uid = req.user.uid;
  const email = req.user.email || req.body.email || "";
  const name = req.body.name || req.user.name || "Anonymous";

  const session = driver.session();
  try {
    const result = await session.run(
      `MERGE (u:User {uid: $uid})
       ON CREATE SET u.bio = "", u.interests = [], u.createdAt = datetime()
       SET u.name = $name, u.email = $email
       RETURN u.uid AS uid`,
      { uid, name, email }
    );
    res.status(201).json({ message: "User created in Neo4j", uid: result.records?.[0]?.get("uid") });
  } catch (error) {
    console.error("auth/register failed:", error.message);
    res.status(503).json({ error: "Registration temporarily unavailable" });
  } finally {
    await session.close();
  }
});

module.exports = router;