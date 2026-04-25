const driver = require("../config/neo4j");

// CREATE POST
const createPost = async (req, res) => {
  const { uid, content, imageUrl } = req.body;
  const session = driver.session({ database: "irisdb" });

  try {
    const result = await session.run(
      `
      CREATE (p:Post {
        id: randomUUID(),
        content: $content,
        imageUrl: $imageUrl,
        timestamp: datetime()
      })
      WITH p
      MATCH (u:User {uid:$uid})
      CREATE (u)-[:POSTED]->(p)
      RETURN p
      `,
      { uid, content, imageUrl }
    );

    res.json(result.records[0].get("p").properties);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  } finally {
    await session.close();
  }
};

module.exports = { createPost };