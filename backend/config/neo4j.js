const neo4j = require("neo4j-driver");

// Use the local Neo4j instance that you're viewing in Neo4j Browser,
// so what the app writes is exactly what you see there.
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USER,
    process.env.NEO4J_PASSWORD
  )
);

module.exports = driver;