const rateLimit = require("express-rate-limit");

const json = { error: "Too many requests, please slow down." };

// Broad limiter for every API call.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: json,
});

// Tighter limiter for write-heavy / abuse-prone endpoints.
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: json,
});

module.exports = { generalLimiter, writeLimiter };
