const admin = require("firebase-admin");

// Firebase Admin is initialized lazily from an env var (not a checked-in JSON
// file) so a missing credential doesn't crash boot — requests just fail closed
// with 401. Set FIREBASE_SERVICE_ACCOUNT to the full service-account JSON
// (one line). For local dev you can instead point GOOGLE_APPLICATION_CREDENTIALS
// at a file and leave FIREBASE_SERVICE_ACCOUNT unset.

let initError = null;

function ensureAdmin() {
  if (admin.apps.length) return true;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (raw) {
      // Full Admin credentials (only needed for privileged ops; fine to use).
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(raw)),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // ID-token verification only needs the project id — it checks the
      // token signature against Google's public certs and the `aud` claim.
      // No private key required, so the app carries no Admin secret.
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    } else {
      throw new Error("Set FIREBASE_PROJECT_ID (or FIREBASE_SERVICE_ACCOUNT)");
    }
    return true;
  } catch (e) {
    initError = e.message;
    return false;
  }
}

const verifyToken = async (req, res, next) => {
  if (!ensureAdmin()) {
    console.error("Firebase Admin not initialized:", initError);
    return res.status(401).json({ error: "Authentication unavailable" });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.slice("Bearer ".length);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.displayName,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyToken;
