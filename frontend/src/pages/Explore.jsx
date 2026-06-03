import { useEffect, useState } from "react";
import { FiTrendingUp as Flame, FiStar as Sparkles } from "react-icons/fi";
import { apiGet } from "../services/apiClient";
import { toggleLike } from "../services/postApi";
import { useAuth } from "../contexts/AuthContext";
import PostCard from "../components/PostCard";
import FollowButton from "../components/FollowButton";
import {
  colors,
  spacing,
  radius,
  type,
  glassCard,
  tag,
  avatar,
  transition,
  pageShell,
  pageContent,
} from "../theme";

const initialOf = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

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
    return (
      <div data-page-shell style={pageShell()}>
        <div style={pageContent({ maxWidth: 720 })}>
          <p style={styles.placeholder}>Loading Explore…</p>
        </div>
      </div>
    );
  }

  return (
    <div data-page-shell style={pageShell()}>
      <div style={pageContent({ maxWidth: 720 })}>
        <header style={styles.header}>
          <h1 style={{ ...type.largeTitle, color: colors.text }}>Explore</h1>
          <p
            style={{
              ...type.body,
              color: colors.textMuted,
              marginTop: spacing.sm,
            }}
          >
            Trending in the last 24 hours, and people who share your interests.
          </p>
        </header>

        <section style={styles.section}>
          <SectionTitle icon={<Flame size={18} />}>
            Trending now
          </SectionTitle>
          {trending.length === 0 ? (
            <p style={styles.empty}>
              No trending posts yet — be the first to post something people love.
            </p>
          ) : (
            trending.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.uid}
                onLikeToggle={handleLikeToggle}
              />
            ))
          )}
        </section>

        <section style={styles.section}>
          <SectionTitle icon={<Sparkles size={18} />}>
            People who share your interests
          </SectionTitle>
          {byInterest.length === 0 ? (
            <p style={styles.empty}>
              Add interests on your profile to discover like-minded people.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
              {byInterest.map((user) => (
                <article key={user.uid} style={styles.userCard}>
                  <div style={styles.userLeft}>
                    <div style={avatar({ size: 42 })}>{initialOf(user.name)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          ...type.headline,
                          color: colors.text,
                          marginBottom: "4px",
                        }}
                      >
                        {user.name}
                      </div>
                      {user.commonInterests && user.commonInterests.length > 0 && (
                        <div style={styles.tags}>
                          {user.commonInterests.slice(0, 4).map((c, i) => (
                            <span key={i} style={tag({ tone: "brand" })}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <FollowButton
                    targetUserId={user.uid}
                    currentUserId={currentUser?.uid}
                  />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const SectionTitle = ({ icon, children }) => (
  <h2
    style={{
      ...type.title3,
      color: colors.text,
      display: "flex",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    }}
  >
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "10px",
        background: colors.primarySoft,
        border: `1px solid ${colors.primaryBorder}`,
        color: colors.primary,
      }}
    >
      {icon}
    </span>
    {children}
  </h2>
);

const styles = {
  header: {
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing["2xl"],
  },
  empty: {
    ...type.body,
    color: colors.textFaint,
    padding: spacing.lg,
    background: colors.glassBgSoft,
    border: `1px dashed ${colors.glassBorder}`,
    borderRadius: radius.md,
  },
  placeholder: {
    ...type.body,
    color: colors.textFaint,
    padding: spacing["2xl"],
    textAlign: "center",
  },
  userCard: {
    ...glassCard({ padded: false }),
    padding: spacing.lg,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    transition: transition(["transform", "background", "box-shadow"]),
  },
  userLeft: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  tags: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
};

export default Explore;
