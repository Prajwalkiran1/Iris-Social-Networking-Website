import { useEffect, useState } from "react";
import { getFeed } from "../services/feedApi";
import { toggleLike } from "../services/postApi";
import { apiGet } from "../services/apiClient";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";
import SuggestedUsers from "../components/SuggestedUsers";
import { useAuth } from "../contexts/AuthContext";
import {
  colors,
  spacing,
  radius,
  type,
  glassCard,
  gradients,
  pageShell,
  pageContent,
} from "../theme";

const HomeFeed = () => {
  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [currentUserData, setCurrentUserData] = useState({
    name: "",
    uid: "",
    followers: 0,
    following: 0,
  });

  const fetchFollowerCounts = async (userId) => {
    try {
      const data = await apiGet(`/follow/counts/${userId}`);
      setCurrentUserData((prev) => ({
        ...prev,
        followers: data.followers,
        following: data.following,
      }));
    } catch (error) {
      console.error("Error fetching follower counts:", error.message);
    }
  };

  useEffect(() => {
    const loadFeedData = async () => {
      setLoading(true);
      try {
        const postsData = await getFeed();
        const safeData = postsData.map((post) => ({
          id: post.id,
          content: post.content || "",
          imageUrl: post.imageUrl || "",
          timestamp: post.timestamp || new Date().toISOString(),
          likeCount: post.likeCount || 0,
          isLiked: post.isLiked || false,
          author: {
            uid: post.author?.uid || "",
            name: post.author?.name || "Unknown",
            isFollowing: post.author?.isFollowing || false,
          },
        }));
        setPosts(safeData);

        try {
          const data = await apiGet("/recommendations/people");
          setSuggestedUsers((Array.isArray(data) ? data : []).slice(0, 5));
        } catch (recError) {
          setSuggestedUsers([]);
        }

        if (currentUser?.uid) {
          setCurrentUserData({
            name: currentUser.displayName || "User",
            uid: currentUser.uid,
            followers: 0,
            following: 0,
          });
          await fetchFollowerCounts(currentUser.uid);
        }
      } catch (err) {
        console.error("Error loading feed:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadFeedData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleCreatePost = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const applyPost = (postId, patch) =>
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, ...patch } : post))
    );

  const handleLikeToggle = async (postId) => {
    const target = posts.find((p) => p.id === postId);
    if (!target || !currentUser?.uid) return;

    applyPost(postId, {
      isLiked: !target.isLiked,
      likeCount: target.isLiked
        ? Math.max(0, target.likeCount - 1)
        : target.likeCount + 1,
    });

    try {
      const data = await toggleLike(postId);
      applyPost(postId, {
        isLiked: data.isLiked,
        likeCount: data.likeCount,
      });
    } catch (err) {
      console.error("Like failed, reverting:", err.message);
      applyPost(postId, {
        isLiked: target.isLiked,
        likeCount: target.likeCount,
      });
    }
  };

  if (loading) {
    return (
      <div data-page-shell style={pageShell()}>
        <div style={pageContent({ maxWidth: 1180 })}>
          <p style={styles.placeholder}>Loading feed…</p>
        </div>
      </div>
    );
  }

  const initial = (currentUserData.name || "U").charAt(0).toUpperCase();

  return (
    <div data-page-shell style={pageShell()}>
      <div style={pageContent({ maxWidth: 1180 })}>
        <div style={styles.contentLayout}>
          {/* Main feed column */}
          <main style={styles.feed}>
            <header style={styles.feedHeader}>
              <h1 style={{ ...type.largeTitle, color: colors.text }}>Home</h1>
              <p
                style={{
                  ...type.body,
                  color: colors.textMuted,
                  marginTop: spacing.sm,
                }}
              >
                See what's happening with your connections.
              </p>
            </header>

            <CreatePost onCreate={handleCreatePost} />

            {posts.length === 0 ? (
              <div style={styles.emptyState}>
                <h3 style={{ ...type.title3, color: colors.text, marginBottom: spacing.sm }}>
                  No posts yet
                </h3>
                <p style={{ ...type.body, color: colors.textMuted }}>
                  Be the first to share something with your community.
                </p>
              </div>
            ) : (
              <div style={styles.postsContainer}>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserData.uid}
                    onLikeToggle={handleLikeToggle}
                  />
                ))}
              </div>
            )}
          </main>

          {/* Right sidebar — hides under 1024px via inline conditional */}
          <aside style={styles.sidebar}>
            <div style={styles.profileCard}>
              <div style={styles.avatarRing}>
                <div style={styles.avatar}>{initial}</div>
              </div>
              <div style={styles.profileInfo}>
                <h3 style={{ ...type.title3, color: colors.text }}>
                  {currentUserData.name || "User"}
                </h3>
                {currentUserData.uid && (
                  <p style={{ ...type.footnote, color: colors.textFaint }}>
                    @{currentUserData.uid.slice(0, 6)}
                  </p>
                )}
              </div>
              <div style={styles.profileStats}>
                <Stat label="Followers" value={currentUserData.followers} />
                <span style={styles.statsDivider} />
                <Stat label="Following" value={currentUserData.following} />
              </div>
            </div>

            <SuggestedUsers users={suggestedUsers} />
          </aside>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <span style={{ ...type.headline, color: colors.text }}>{value}</span>
    <span
      style={{
        ...type.caption,
        color: colors.textFaint,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginTop: "2px",
      }}
    >
      {label}
    </span>
  </div>
);

const styles = {
  placeholder: {
    ...type.body,
    color: colors.textFaint,
    padding: spacing["2xl"],
    textAlign: "center",
  },
  contentLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: spacing.xl,
    alignItems: "start",
  },
  feed: {
    minWidth: 0,
    maxWidth: "640px",
    margin: "0 auto",
    width: "100%",
  },
  feedHeader: {
    marginBottom: spacing.xl,
  },
  emptyState: {
    ...glassCard({ padded: false }),
    padding: spacing["2xl"],
    textAlign: "center",
  },
  postsContainer: {
    display: "flex",
    flexDirection: "column",
  },
  sidebar: {
    position: "sticky",
    top: spacing.xl,
    display: "flex",
    flexDirection: "column",
  },
  profileCard: {
    ...glassCard({ padded: false }),
    padding: spacing.xl,
    marginBottom: spacing.xl,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  avatarRing: {
    padding: "3px",
    borderRadius: "50%",
    background: gradients.brand,
    marginBottom: spacing.md,
  },
  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: colors.surface,
    color: colors.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: 700,
  },
  profileInfo: {
    marginBottom: spacing.lg,
  },
  profileStats: {
    display: "flex",
    alignItems: "center",
    gap: spacing.lg,
    width: "100%",
    justifyContent: "center",
    padding: `${spacing.sm} 0 0`,
    borderTop: `1px solid ${colors.glassBorder}`,
    paddingTop: spacing.md,
  },
  statsDivider: {
    width: "1px",
    height: "26px",
    background: colors.glassBorder,
  },
};

export default HomeFeed;
