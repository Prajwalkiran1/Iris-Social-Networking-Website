const driver = require("../config/neo4j");
const { randomUUID } = require("crypto");
const { toIsoString } = require("../utils/neoTime");

exports.sendMessage = async (req, res) => {
  const session = driver.session();
  const sender = req.user.uid;
  const { receiver, text } = req.body;

  if (!receiver || !text || !text.trim()) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    await session.run(
      `
      CREATE (m:Message {
        id: randomUUID(),
        text: $text,
        timestamp: datetime()
      })
      WITH m
      MATCH (a:User {uid:$sender})
      MATCH (b:User {uid:$receiver})
      CREATE (a)-[:SENT]->(m)
      CREATE (m)-[:TO]->(b)
      `,
      { sender, receiver, text }
    );

    res.status(201).json({ success: true });
  } catch (e) {
    console.error("sendMessage failed:", e.message);
    res.status(503).json({ error: "Messaging temporarily unavailable" });
  } finally {
    await session.close();
  }
};

exports.getChat = async (req, res) => {
  const session = driver.session();
  const me = req.user.uid;
  const friend = req.params.friendId;

  try {
    // ORDER BY after a top-level UNION only applies to the last leg in
    // Cypher, which interleaved sent vs. received messages incorrectly.
    // Wrapping the union in a CALL {} subquery lets us sort the merged
    // result by timestamp.
    const result = await session.run(
      `
      CALL {
        MATCH (u1:User {uid:$me})-[:SENT]->(m:Message)-[:TO]->(u2:User {uid:$friend})
        RETURN m, $me AS sender
        UNION
        MATCH (u2:User {uid:$friend})-[:SENT]->(m:Message)-[:TO]->(u1:User {uid:$me})
        RETURN m, $friend AS sender
      }
      RETURN m.id AS id, m.text AS text, m.timestamp AS timestamp, sender
      ORDER BY timestamp
      `,
      { me, friend }
    );

    const messages = result.records.map(r => ({
      id: r.get("id") || `msg-${Date.now()}-${Math.random()}`,
      text: r.get("text"),
      timestamp: toIsoString(r.get("timestamp")),
      sender: r.get("sender")
    }));

    res.json(messages);
  } catch (e) {
    console.error("getChat failed:", e.message);
    res.status(503).json({ error: "Messaging temporarily unavailable", messages: [] });
  } finally {
    await session.close();
  }
};

// GET ALL CONVERSATIONS FOR A USER
exports.getAllConversations = async (req, res) => {
  const session = driver.session();
  const userId = req.user.uid;

  try {
    // For each conversation partner, pick the latest message across both
    // send directions. The previous query reused `m` across two OPTIONAL
    // MATCHes and grouped per-row, returning incorrect results when both
    // sides had sent messages.
    const result = await session.run(
      `
      MATCH (me:User {uid:$userId})
      CALL {
        WITH me
        MATCH (me)-[:SENT]->(m:Message)-[:TO]->(other:User)
        RETURN other, m
        UNION
        WITH me
        MATCH (other:User)-[:SENT]->(m:Message)-[:TO]->(me)
        RETURN other, m
      }
      WITH other, m
      ORDER BY m.timestamp DESC
      WITH other, head(collect(m)) AS lastMessage
      RETURN other.uid AS uid,
             other.name AS name,
             lastMessage.text AS lastMessage,
             lastMessage.timestamp AS timestamp
      ORDER BY lastMessage.timestamp DESC
      `,
      { userId }
    );

    const conversations = result.records.map(record => ({
      uid: record.get("uid"),
      name: record.get("name"),
      lastMessage: record.get("lastMessage"),
      timestamp: toIsoString(record.get("timestamp"))
    }));

    res.json(conversations);
  } catch (e) {
    console.error("getAllConversations failed:", e.message);
    res.status(503).json({ error: "Messaging temporarily unavailable", conversations: [] });
  } finally {
    await session.close();
  }
};

module.exports = {
  sendMessage: exports.sendMessage,
  getChat: exports.getChat,
  getAllConversations: exports.getAllConversations
};