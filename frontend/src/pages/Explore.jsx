import { useEffect, useState } from "react";
import { apiGet } from "../services/apiClient";
import { toggleLike } from "../services/postApi";
import { useAuth } from "../contexts/AuthContext";
import PostCard from "../components/PostCard";
import FollowButton from "../components/FollowButton";

const Explore = () => {
  const { currentUser } = useAuth();
  const [trending, setTrending] = useState([]);
  const [byInterest, setByInterest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [t, i] = await Promise.allSettled([
        apiGet("/recommendations/trending"),
        apiGet("/recommendations/interests"),
      ]);
      if (!active) return;
      setTrending(t.status === "fulfilled" && Array.isArray(t.value) ? t.value : []);
      setByInterest(i.status === "fulfilled" && Array.isArray(i.value) ? i.value : []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleLikeToggle = async (postId) => {
    const target = trending.find((p) => p.id === postId);
    if (!target) return;
    setTrending((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likeCount: p.isLiked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1,
            }
          : p
      )
    );
    try {
      const data = await toggleLike(postId);
      setTrending((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isLiked: data.isLiked, likeCount: data.likeCount } : p
        )
      );
    } catch (err) {
      console.error("Like failed:", err.message);
      setTrending((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: target.isLiked, likeCount: target.likeCount }
            : p
        )
      );
    }
  };

  if (loading) {
    return <div style={styles.page}><div style={styles.loading}>Loading Explore…</div></div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Explore</h1>
          <p style={styles.subtitle}>
            Trending in the last 24 hours, and people who share your interests.
          </p>
        </div>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🔥 Trending now</h2>
          {trending.length === 0 ? (
            <p style={styles.empty}>No trending posts yet — be the first to post something people love.</p>
          ) : (
            trending.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.uid}
                onFollowToggle={() => {}}
                onLikeToggle={handleLikeToggle}
              />
            ))
          )}
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>✨ People who share your interests</h2>
          {byInterest.length === 0 ? (
            <p style={styles.empty}>
              Add interests on your profile to discover like-minded people.
            </p>
          ) : (
            byInterest.map((user) => (
              <div key={user.uid} style={styles.userCard}>
                <div>
                  <div style={styles.userName}>{user.name}</div>
                  <div style={styles.common}>
                    {user.commonInterests?.slice(0, 4).map((c, i) => (
                      <span key={i} style={styles.tag}>{c}</span>
                    ))}
                  </div>
                </div>
                <FollowButton targetUserId={user.uid} currentUserId={currentUser?.uid} />
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

const styles = {
  page: { marginLeft: "70px", minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#fff" },
  wrapper: { maxWidth: "680px", margin: "0 auto", padding: "30px" },
  header: { marginBottom: "24px" },
  title: { fontSize: "32px", fontWeight: 700, marginBottom: "6px" },
  subtitle: { color: "#888", fontSize: "15px" },
  section: { marginBottom: "36px" },
  sectionTitle: { fontSize: "20px", fontWeight: 600, marginBottom: "16px" },
  empty: { color: "#888", fontSize: "14px" },
  loading: { padding: "40px", color: "#aaa" },
  userCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#1f1f1f",
    borderRadius: "10px",
    padding: "14px 18px",
    marginBottom: "10px",
  },
  userName: { fontWeight: 600, marginBottom: "6px" },
  common: { display: "flex", gap: "6px", flexWrap: "wrap" },
  tag: {
    padding: "2px 8px",
    background: "#333",
    borderRadius: "10px",
    fontSize: "12px",
    color: "#bbb",
  },
};

export default Explore;
