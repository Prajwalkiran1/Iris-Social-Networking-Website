// Minimal hand-rolled validation. Each function is Express middleware that
// returns a clean 400 envelope on bad input and otherwise calls next().

const isStr = (v) => typeof v === "string";

const fail = (res, msg) => res.status(400).json({ error: msg });

function validatePost(req, res, next) {
  const { content, imageUrl } = req.body || {};
  if (!isStr(content) || !content.trim()) {
    return fail(res, "Post content is required");
  }
  if (content.length > 5000) {
    return fail(res, "Post content is too long (max 5000 chars)");
  }
  if (imageUrl !== undefined && !isStr(imageUrl)) {
    return fail(res, "imageUrl must be a string");
  }
  next();
}

function validateMessage(req, res, next) {
  const { receiver, text } = req.body || {};
  if (!isStr(receiver) || !receiver.trim()) {
    return fail(res, "receiver is required");
  }
  if (!isStr(text) || !text.trim()) {
    return fail(res, "Message text is required");
  }
  if (text.length > 2000) {
    return fail(res, "Message is too long (max 2000 chars)");
  }
  next();
}

function validateProfile(req, res, next) {
  const { name, bio, interests, photoURL } = req.body || {};
  if (name !== undefined && (!isStr(name) || name.length > 80)) {
    return fail(res, "Name must be a string up to 80 chars");
  }
  if (bio !== undefined && (!isStr(bio) || bio.length > 500)) {
    return fail(res, "Bio must be a string up to 500 chars");
  }
  if (interests !== undefined) {
    if (
      !Array.isArray(interests) ||
      interests.length > 30 ||
      !interests.every((i) => isStr(i) && i.length <= 40)
    ) {
      return fail(res, "Interests must be up to 30 short strings");
    }
  }
  if (photoURL !== undefined && photoURL !== null) {
    if (!isStr(photoURL) || photoURL.length > 2000) {
      return fail(res, "photoURL must be a string up to 2000 chars");
    }
  }
  next();
}

module.exports = { validatePost, validateMessage, validateProfile };
