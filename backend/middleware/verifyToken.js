const admin = require("firebase-admin");
const serviceAccount = require("../firebaseServiceAccount.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log("Auth header received:", authHeader ? "yes" : "no");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No token found in request");
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log("Token verified for uid:", decoded.uid);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("Token verification failed:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyToken;