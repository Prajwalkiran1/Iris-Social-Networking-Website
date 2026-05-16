const express = require("express");
require("dotenv").config();

const db = require("./config/neo4j");

const helmet = require("helmet");
const verifyToken = require("./middleware/verifyToken");
const { generalLimiter, writeLimiter } = require("./middleware/rateLimit");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const messageRoutes = require("./routes/messageRoutes");
const searchRoutes = require("./routes/searchRoutes");
const postRoutes = require("./routes/postRoutes");
const followRoutes = require("./routes/followRoutes");
const feedRoutes = require("./routes/feedRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();

const cors = require("cors");

// CORS: localhost for dev + the deployed frontend origin (FRONTEND_ORIGIN)
// in production. Undefined entries are filtered out.
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// Broad rate limit on the whole API (runs before auth so floods are cheap).
app.use("/api", generalLimiter);

// Every data route requires a verified Firebase ID token. The actor's uid is
// taken from the token (req.user.uid), never from the request body/params.
// writeLimiter throttles the abuse-prone write endpoints more aggressively.
app.use("/api/auth", verifyToken, authRoutes);
app.use("/api/profile", verifyToken, profileRoutes);
app.use("/api/messages", verifyToken, messageRoutes);
app.use("/api/search", verifyToken, searchRoutes);
app.use("/api/posts", writeLimiter, verifyToken, postRoutes);
app.use("/api/follow", verifyToken, followRoutes);
app.use("/api/feed", verifyToken, feedRoutes);
app.use("/api/recommendations", verifyToken, recommendationRoutes);

// Health check — used by the frontend and by the deploy host's probe.
app.get("/api/health", async (req, res) => {
  let dbOk = false;
  try {
    await db.verifyConnectivity();
    dbOk = true;
  } catch (e) {
    dbOk = false;
  }
  res.json({ ok: true, db: dbOk });
});

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Listen only when run directly, so tests can import the app with supertest.
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
