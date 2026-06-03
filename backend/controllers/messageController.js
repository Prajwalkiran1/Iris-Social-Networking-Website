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
    // For each conversation partner: latest message across both directions,
    // plus an unread count (messages from `other` to `me` newer than the
    // LAST_READ_AT timestamp). If no LAST_READ_AT exists, all received
    // messages are considered unread.
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
      WITH me, other, m
      ORDER BY m.timestamp DESC
      WITH me, other, head(collect(m)) AS lastMessage
      OPTIONAL MATCH (me)-[r:LAST_READ_AT]->(other)
      WITH me, other, lastMessage, r.ts AS lastReadTs
      CALL {
        WITH me, other, lastReadTs
        MATCH (other)-[:SENT]->(im:Message)-[:TO]->(me)
        WHERE lastReadTs IS NULL OR im.timestamp > lastReadTs
        RETURN count(im) AS unreadCount
      }
      RETURN other.uid AS uid,
             other.name AS name,
             other.photoURL AS photoURL,
             lastMessage.text AS lastMessage,
             lastMessage.timestamp AS timestamp,
             unreadCount
      ORDER BY lastMessage.timestamp DESC
      `,
      { userId }
    );

    const conversations = result.records.map(record => {
      const raw = record.get("unreadCount");
      const unread =
        raw && typeof raw === "object" && "low" in raw ? raw.low : Number(raw) || 0;
      return {
        uid: record.get("uid"),
        photoURL: record.get("photoURL"),
        name: record.get("name"),
        lastMessage: record.get("lastMessage"),
        timestamp: toIsoString(record.get("timestamp")),
        unreadCount: unread,
      };
    });

    res.json(conversations);
  } catch (e) {
    console.error("getAllConversations failed:", e.message);
    res.status(503).json({ error: "Messaging temporarily unavailable", conversations: [] });
  } finally {
    await session.close();
  }
};

// Mark a conversation as read up to "now". Upserts the LAST_READ_AT
// relationship from the caller (me) to the friend.
exports.markRead = async (req, res) => {
  const session = driver.session();
  const me = req.user.uid;
  const friend = req.params.friendId;

  if (!friend) {
    return res.status(400).json({ error: "friendId is required" });
  }

  try {
    await session.run(
      `
      MATCH (me:User {uid:$me})
      MATCH (friend:User {uid:$friend})
      MERGE (me)-[r:LAST_READ_AT]->(friend)
      SET r.ts = datetime()
      RETURN r.ts AS ts
      `,
      { me, friend }
    );
    res.status(204).end();
  } catch (e) {
    console.error("markRead failed:", e.message);
    res.status(503).json({ error: "Could not mark as read" });
  } finally {
    await session.close();
  }
};

module.exports = {
  sendMessage: exports.sendMessage,
  getChat: exports.getChat,
  getAllConversations: exports.getAllConversations,
  markRead: exports.markRead,
};