// Re-export the shared Neo4j driver configuration so older code that imports
// `../neo4j` continues to work consistently with the new config-based setup.
//
// All Neo4j connections in the backend now use the credentials from
// `backend/config/neo4j.js` (which is driven by environment variables).

const driver = require("./config/neo4j");

module.exports = driver;