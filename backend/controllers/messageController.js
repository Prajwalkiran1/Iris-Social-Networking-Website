const driver = require("../config/neo4j");
const { randomUUID } = require("crypto");

exports.sendMessage = async (req, res) => {
  const session = driver.session({ database: "irisdb" });
  const { sender, receiver, text } = req.body;

  if (!sender || !receiver || !text) {
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
    console.error(e);
    res.status(500).json({ error: "Failed to send message" });
  } finally {
    await session.close();
  }
};

exports.getChat = async (req, res) => {
  const session = driver.session({ database: "irisdb" });
  const { me } = req.query;
  const friend = req.params.friendId;

  try {
    const result = await session.run(
      `
      MATCH (u1:User {uid:$me})-[:SENT]->(m)-[:TO]->(u2:User {uid:$friend})
      RETURN m.id AS id, m.text AS text, m.timestamp AS timestamp, $me AS sender

      UNION

      MATCH (u2:User {uid:$friend})-[:SENT]->(m)-[:TO]->(u1:User {uid:$me})
      RETURN m.id AS id, m.text AS text, m.timestamp AS timestamp, $friend AS sender

      ORDER BY timestamp
      `,
      { me, friend }
    );

    const messages = result.records.map(r => {
      const timestamp = r.get("timestamp");
      let isoTimestamp;
      
      if (timestamp && typeof timestamp === 'object') {
        // Convert Neo4j DateTime to JavaScript Date
        isoTimestamp = new Date(
          timestamp.year.low,
          timestamp.month.low - 1, // JavaScript months are 0-indexed
          timestamp.day.low,
          timestamp.hour.low,
          timestamp.minute.low,
          timestamp.second.low,
          timestamp.nanosecond.low / 1000000
        ).toISOString();
      } else {
        isoTimestamp = new Date().toISOString();
      }
      
      return {
        id: r.get("id") || `msg-${Date.now()}-${Math.random()}`,
        text: r.get("text"),
        timestamp: isoTimestamp,
        sender: r.get("sender")
      };
    });

    res.json(messages);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch chat" });
  } finally {
    await session.close();
  }
};

// GET ALL CONVERSATIONS FOR A USER
exports.getAllConversations = async (req, res) => {
  const session = driver.session({ database: "irisdb" });
  const { userId } = req.params;

  try {
    // Get all conversations where the user is either sender or receiver
    const result = await session.run(
      `
      MATCH (u:User {uid:$userId})
      OPTIONAL MATCH (u)-[:SENT]->(m)-[:TO]->(other:User)
      OPTIONAL MATCH (other:User)-[:SENT]->(m)-[:TO]->(u)
      WITH other, m
      ORDER BY m.timestamp DESC
      WITH other, collect(m)[0] AS lastMessage
      WHERE lastMessage IS NOT NULL
      RETURN DISTINCT other.uid AS uid, other.name AS name, lastMessage.text AS lastMessage, lastMessage.timestamp AS timestamp
      `,
      { userId }
    );

    const conversations = result.records.map(record => {
      const timestamp = record.get("timestamp");
      const isoTimestamp = timestamp ? new Date(
        timestamp.year.low,
        timestamp.month.low - 1,
        timestamp.day.low,
        timestamp.hour.low,
        timestamp.minute.low,
        timestamp.second.low,
        timestamp.nanosecond.low / 1000000
      ).toISOString() : new Date().toISOString();

      return {
        uid: record.get("uid"),
        name: record.get("name"),
        lastMessage: record.get("lastMessage"),
        timestamp: isoTimestamp
      };
    });

    res.json(conversations);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch conversations" });
  } finally {
    await session.close();
  }
};

module.exports = {
  sendMessage: exports.sendMessage,
  getChat: exports.getChat,
  getAllConversations: exports.getAllConversations
};