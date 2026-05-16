// Seed a demo graph so the feed / recommendations / trending look alive.
// Usage: node scripts/seed.js   (uses backend/.env — local Docker or Aura)
// Idempotent: re-running updates rather than duplicates.
require("dotenv").config();
const db = require("../config/neo4j");

const users = [
  { uid: "demo_ava", name: "Ava Chen", interests: ["photography", "travel", "art"] },
  { uid: "demo_ben", name: "Ben Ortiz", interests: ["technology", "gaming", "music"] },
  { uid: "demo_cora", name: "Cora Singh", interests: ["art", "music", "reading"] },
  { uid: "demo_dan", name: "Dan Kim", interests: ["technology", "fitness", "cooking"] },
  { uid: "demo_eve", name: "Eve Moreau", interests: ["travel", "photography", "nature"] },
  { uid: "demo_finn", name: "Finn Walsh", interests: ["music", "gaming", "movies"] },
  { uid: "demo_gia", name: "Gia Rossi", interests: ["art", "fashion", "photography"] },
  { uid: "demo_hugo", name: "Hugo Brandt", interests: ["technology", "reading", "writing"] },
];

// follower -> followee
const follows = [
  ["demo_ava", "demo_ben"], ["demo_ava", "demo_cora"], ["demo_ben", "demo_dan"],
  ["demo_ben", "demo_eve"], ["demo_cora", "demo_dan"], ["demo_cora", "demo_gia"],
  ["demo_dan", "demo_hugo"], ["demo_eve", "demo_finn"], ["demo_finn", "demo_gia"],
  ["demo_gia", "demo_hugo"], ["demo_hugo", "demo_ava"],
];

const posts = [
  { author: "demo_ben", content: "Just shipped a graph-powered recommendation engine 🚀" },
  { author: "demo_ava", content: "Golden hour over the harbour never gets old 📷" },
  { author: "demo_cora", content: "Sketchbook page 42 — finally happy with this one." },
  { author: "demo_dan", content: "Hot take: graph databases make social features trivial." },
  { author: "demo_eve", content: "Trail run + cold plunge. Best way to start a weekend." },
];

// who likes which post index
const likes = [
  [0, ["demo_ava", "demo_cora", "demo_dan", "demo_hugo"]],
  [1, ["demo_eve", "demo_gia"]],
  [3, ["demo_ben", "demo_hugo", "demo_cora"]],
];

async function run() {
  const session = db.session();
  try {
    await session.run(
      "CREATE CONSTRAINT user_uid IF NOT EXISTS FOR (u:User) REQUIRE u.uid IS UNIQUE"
    );

    for (const u of users) {
      await session.run(
        `MERGE (x:User {uid:$uid})
         ON CREATE SET x.createdAt = datetime()
         SET x.name = $name, x.email = $uid + "@demo.iris",
             x.bio = "Demo user", x.interests = $interests`,
        u
      );
    }

    for (const [a, b] of follows) {
      await session.run(
        `MATCH (a:User {uid:$a}),(b:User {uid:$b}) MERGE (a)-[:FOLLOWS]->(b)`,
        { a, b }
      );
    }

    const postIds = [];
    for (let i = 0; i < posts.length; i++) {
      const r = await session.run(
        `MATCH (u:User {uid:$author})
         MERGE (u)-[:POSTED]->(p:Post {seedKey:$key})
         ON CREATE SET p.id = randomUUID(), p.timestamp = datetime()
         SET p.content = $content, p.imageUrl = "", p.likeCount = 0
         RETURN p.id AS id`,
        { author: posts[i].author, content: posts[i].content, key: `seed-${i}` }
      );
      postIds.push(r.records[0].get("id"));
    }

    for (const [idx, likers] of likes) {
      for (const liker of likers) {
        await session.run(
          `MATCH (u:User {uid:$liker}),(p:Post {id:$pid})
           MERGE (u)-[:LIKED]->(p)`,
          { liker, pid: postIds[idx] }
        );
      }
      await session.run(
        `MATCH (p:Post {id:$pid})<-[l:LIKED]-() WITH p, count(l) AS c
         SET p.likeCount = c`,
        { pid: postIds[idx] }
      );
    }

    console.log(`Seeded ${users.length} users, ${follows.length} follows, ${posts.length} posts.`);
  } finally {
    await session.close();
    await db.close();
  }
}

run().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
