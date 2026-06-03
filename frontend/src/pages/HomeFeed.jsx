import { useEffect, useState } from "react";
import { getFeed } from "../services/feedApi";
import { toggleLike } from "../services/postApi";
import { apiGet } from "../services/apiClient";
import { FiMessageSquare } from "react-icons/fi";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";
import SuggestedUsers from "../components/SuggestedUsers";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import FollowButton from "../components/FollowButton";
import Avatar from "../components/Avatar";
import { useAuth } from "../contexts/AuthContext";
import useIsMobile from "../hooks/useIsMobile";
import {
  colors,
  spacing,
  radius,
  type,
  glassCard,
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
    photoURL: null,
    followers: 0,
    following: 0,
  });
  // Hide the right sidebar (profile card + suggestions) under 960px so the
  // feed gets the full content width.
  const hideSidebar = useIsMobile(960);
  // null | "followers" | "following" — opens the corresponding list modal
  const [openList, setOpenList] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const loadFollowLists = async (uid) => {
    try {
      const [f, g] = await Promise.all([
        apiGet(`/follow/followers/${uid}`),
        apiGet(`/follow/following/${uid}`),
      ]);
      setFollowers(Array.isArray(f) ? f : []);
      setFollowing(Array.isArray(g) ? g : []);
    } catch (err) {
      console.error("Failed to load follow lists:", err.message);
    }
  };

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
            photoURL: post.author?.photoURL || null,
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
          // Fetch own profile (to pick up photoURL) alongside counts.
          try {
            const ownProfile = await apiGet(`/profile/${currentUser.uid}`);
            setCurrentUserData((prev) => ({
              ...prev,
              name: ownProfile?.name || currentUser.displayName || "User",
              uid: currentUser.uid,
              photoURL: ownProfile?.photoURL || null,
            }));
          } catch (e) {
            setCurrentUserData((prev) => ({
              ...prev,
              name: currentUser.displayName || "User",
              uid: currentUser.uid,
            }));
          }
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

  return (
    <div data-page-shell style={pageShell()}>
      <div style={pageContent({ maxWidth: 1180 })}>
        <div style={styles.contentLayout(hideSidebar)}>
          {/* Main feed column */}
          <main style={styles.feed(hideSidebar)}>
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
              <EmptyState
                icon={<FiMessageSquare size={22} />}
                title="No posts yet"
                body="Follow a few people from Explore, or write the first post yourself."
              />
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

          {/* Right sidebar — hidden under 960px so the feed gets full width.
              CSS belt-and-suspenders via data-hide-under-960 guarantees the
              hide even if the JS hook misfires. */}
          {!hideSidebar && (
          <aside data-hide-under-960 style={styles.sidebar}>
            <div style={styles.profileCard}>
              <Avatar
                user={{
                  name: currentUserData.name,
                  photoURL: currentUserData.photoURL,
                }}
                size={72}
                ring
                style={{ marginBottom: spacing.md }}
              />
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
                <Stat
                  label="Followers"
                  value={currentUserData.followers}
                  onClick={() => {
                    setOpenList("followers");
                    if (!followers.length && !following.length && currentUserData.uid) {
                      loadFollowLists(currentUserData.uid);
                    }
                  }}
                />
                <span style={styles.statsDivider} />
                <Stat
                  label="Following"
                  value={currentUserData.following}
                  onClick={() => {
                    setOpenList("following");
                    if (!followers.length && !following.length && currentUserData.uid) {
                      loadFollowLists(currentUserData.uid);
                    }
                  }}
                />
              </div>
            </div>

            <SuggestedUsers users={suggestedUsers} />
          </aside>
          )}
        </div>
      </div>

      <Modal
        open={openList !== null}
        onClose={() => setOpenList(null)}
        title={openList === "following" ? "Following" : "Followers"}
      >
        <FollowList
          users={openList === "following" ? following : followers}
          currentUserId={currentUserData.uid}
          emptyText={
            openList === "following"
              ? "You're not following anyone yet."
              : "You don't have any followers yet."
          }
        />
      </Modal>
    </div>
  );
};

const Stat = ({ label, value, onClick }) => {
  const clickable = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "transparent",
        border: "none",
        padding: clickable ? "6px 14px" : 0,
        borderRadius: "12px",
        cursor: clickable ? "pointer" : "default",
        fontFamily: "inherit",
        transition: "background 220ms cubic-bezier(.2,.8,.2,1)",
      }}
      onMouseEnter={(e) => {
        if (clickable) e.currentTarget.style.background = colors.glassBg;
      }}
      onMouseLeave={(e) => {
        if (clickable) e.currentTarget.style.background = "transparent";
      }}
    >
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
    </button>
  );
};

const FollowList = ({ users, currentUserId, emptyText }) => {
  if (!users.length) {
    return (
      <EmptyState title="Nothing here yet" body={emptyText} />
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      {users.map((user) => (
        <div
          key={user.uid}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
            padding: spacing.md,
            background: colors.glassBgSoft,
            border: `1px solid ${colors.glassBorder}`,
            borderRadius: radius.md,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.md,
              flex: 1,
              minWidth: 0,
            }}
          >
            <Avatar user={user} size={38} />
            <div style={{ minWidth: 0 }}>
              <div style={{ ...type.callout, color: colors.text, fontWeight: 600 }}>
                {user.name}
              </div>
              <div style={{ ...type.footnote, color: colors.textFaint }}>
                {user.email}
              </div>
            </div>
          </div>
          <FollowButton targetUserId={user.uid} currentUserId={currentUserId} />
        </div>
      ))}
    </div>
  );
};

const styles = {
  placeholder: {
    ...type.body,
    color: colors.textFaint,
    padding: spacing["2xl"],
    textAlign: "center",
  },
  contentLayout: (single) => ({
    display: "grid",
    gridTemplateColumns: single ? "minmax(0, 1fr)" : "minmax(0, 1fr) 320px",
    gap: spacing.xl,
    alignItems: "start",
  }),
  feed: (single) => ({
    minWidth: 0,
    // On phones the sidebar is gone — let the feed claim the full content
    // width so post cards don't look like narrow floating cards. On desktop
    // keep the 640 cap so posts stay readable at large viewports.
    maxWidth: single ? "none" : "640px",
    margin: "0 auto",
    width: "100%",
  }),
  feedHeader: {
    marginBottom: spacing.xl,
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
