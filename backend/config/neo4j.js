const neo4j = require("neo4j-driver");

// Single source of truth for the Neo4j connection.
//
// The driver is created lazily on first use so that a missing or invalid
// NEO4J_* environment does NOT crash the process at require() time. When the
// DB is unreachable, individual controllers fall back to mock data instead.
//
// The target database is configurable via NEO4J_DATABASE and defaults to
// "neo4j" (the only database available on Neo4j Community Edition). The app
// previously hardcoded "irisdb", which requires Enterprise multi-database
// support; callers may still pass { database: ... } but it is ignored — the
// configured database always wins so there is one place to change it.

const DATABASE = process.env.NEO4J_DATABASE || "neo4j";

let _driver = null;

function getDriver() {
  if (_driver) return _driver;

  const uri = process.env.NEO4J_URI;
  if (!uri) {
    throw new Error(
      "NEO4J_URI is not set. Copy backend/.env.example to backend/.env."
    );
  }

  _driver = neo4j.driver(
    uri,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
  );
  return _driver;
}

module.exports = {
  database: DATABASE,

  // Backward-compatible: existing code calls driver.session({ database: ... }).
  // We ignore the caller's database and always use the configured one.
  session() {
    return getDriver().session({ database: DATABASE });
  },

  verifyConnectivity() {
    return getDriver().verifyConnectivity();
  },

  close() {
    return _driver ? _driver.close() : Promise.resolve();
  },
};
