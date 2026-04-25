import { useEffect, useState } from "react";
import { getFeed } from "../services/feedApi";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";
import SuggestedUsers from "../components/SuggestedUsers";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const HomeFeed = () => {
  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [currentUserData, setCurrentUserData] = useState({
    name: "",
    uid: "",
    followers: 0,
    following: 0
  });

  console.log("HomeFeed rendered, currentUser:", currentUser);

  // Function to fetch follower counts
  const fetchFollowerCounts = async (userId) => {
    try {
      const response = await fetch(`/api/follow/counts/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Follower counts:", data);
        setCurrentUserData(prev => ({
          ...prev,
          followers: data.followers,
          following: data.following
        }));
      } else {
        console.log("Failed to fetch follower counts");
      }
    } catch (error) {
      console.error("Error fetching follower counts:", error);
    }
  };

  useEffect(() => {
    const loadFeedData = async () => {
      setLoading(true);
      try {
        // Load posts
        const postsData = await getFeed(currentUser.uid);
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
            isFollowing: post.author?.isFollowing || false
          }
        }));
        setPosts(safeData);

        // Load suggested users
        try {
          const response = await fetch("/api/search/users?q=a", {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            // Filter out current user and limit to 5 suggestions
            const filtered = data
              .filter(user => user.uid !== currentUser?.uid)
              .slice(0, 5);
            setSuggestedUsers(filtered);
          } else {
            console.log("Search API failed, using mock suggestions");
            setSuggestedUsers([
              { uid: "demo-1", name: "Alice", interests: ["music", "travel"] },
              { uid: "demo-2", name: "Bob", interests: ["tech", "sports"] },
              { uid: "demo-3", name: "Carol", interests: ["art", "photography"] }
            ]);
          }
        } catch (searchError) {
          console.log("Search API not available, using mock suggestions");
          setSuggestedUsers([
            { uid: "demo-1", name: "Alice", interests: ["music", "travel"] },
            { uid: "demo-2", name: "Bob", interests: ["tech", "sports"] },
            { uid: "demo-3", name: "Carol", interests: ["art", "photography"] }
          ]);
        }

        // Fetch follower counts for current user
        if (currentUser?.uid) {
          setCurrentUserData({
            name: currentUser.displayName || "User",
            uid: currentUser.uid
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

  const handleFollowToggle = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              author: {
                ...post.author,
                isFollowing: !post.author.isFollowing
              }
            }
          : post
      )
    );
  };

  const handleLikeToggle = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likeCount: post.isLiked
                ? post.likeCount - 1
                : post.likeCount + 1
            }
          : post
      )
    );
  };

  const followingCount = posts.filter(
    (post) => post.author.isFollowing
  ).length;

  if (loading) {
    return <div style={{ color: "#fff", padding: "40px" }}>Loading feed...</div>;
  }

  return (
    <div style={styles.pageContainer}>
      {/* Debug Info */}
      <div style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "#333",
        color: "#fff",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        zIndex: 9999
      }}>
        Debug: {currentUser ? `Logged in as ${currentUser.displayName}` : "Not logged in"}
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginLeft: "10px",
            padding: "2px 6px",
            fontSize: "10px",
            background: "#555",
            color: "#fff",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer"
          }}
        >
          Refresh
        </button>
        <button 
          onClick={() => {
            console.log("Current location:", window.location.href);
            console.log("Frontend port:", window.location.port);
            console.log("Testing basic connectivity...");
            
            // Test basic connectivity without CORS
            fetch('http://localhost:5001/api/debug/neo4j', {
              method: 'GET',
              mode: 'no-cors' // Try without CORS first
            }).then(response => {
              console.log("Basic response:", response);
              return response.text();
            }).then(text => {
              console.log("Basic response text:", text);
              alert('Basic connectivity test: ' + text);
            }).catch(error => {
              console.error("Basic connectivity failed:", error);
              alert('Basic connectivity FAILED: ' + error.message);
            });
          }}
          style={{
            marginLeft: "10px",
            padding: "2px 6px",
            fontSize: "10px",
            background: "#888",
            color: "#fff",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer"
          }}
        >
          Basic Test
        </button>
        <button 
          onClick={() => {
            console.log("Current location:", window.location.href);
            console.log("Frontend port:", window.location.port);
            console.log("Testing with proxy...");
            
            // Test with proxy (relative URL)
            fetch('/api/debug/neo4j', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            }).then(response => {
              console.log("Proxy response:", response);
              return response.json();
            }).then(data => {
              console.log("Proxy data:", data);
              alert('PROXY SUCCESS: ' + JSON.stringify(data));
            }).catch(error => {
              console.error("Proxy failed:", error);
              alert('PROXY FAILED: ' + error.message);
            });
          }}
          style={{
            marginLeft: "10px",
            padding: "2px 6px",
            fontSize: "10px",
            background: "#888",
            color: "#fff",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer"
          }}
        >
          Proxy Test
        </button>
      </div>
      
      <div style={styles.contentWrapper}>
        {/* MAIN FEED */}
        <div style={styles.feed}>
          <div style={styles.feedHeader}>
            <h1 style={styles.feedTitle}>Home Feed</h1>
            <p style={styles.feedSubtitle}>See what's happening with your connections</p>
          </div>
          
          <CreatePost onCreate={handleCreatePost} />

          {loading ? (
            <div style={styles.loadingState}>Loading posts...</div>
          ) : posts.length === 0 ? (
            <div style={styles.emptyState}>
              <h3>No posts yet</h3>
              <p>Be the first to share something with the community!</p>
            </div>
          ) : (
            <div style={styles.postsContainer}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserData.uid}
                  onFollowToggle={handleFollowToggle}
                  onLikeToggle={handleLikeToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={styles.sidebar}>
          <div style={styles.profileCard}>
            <div style={styles.avatar}>
              {currentUserData.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.profileInfo}>
              <h3 style={styles.profileName}>{currentUserData.name}</h3>
              <p style={styles.profileHandle}>@{currentUserData.uid.slice(0, 6)}</p>
            </div>
            <div style={styles.profileStats}>
              <div style={styles.stat}>
                <span style={styles.statNumber}>{currentUserData.followers}</span>
                <span style={styles.statLabel}>Followers</span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statNumber}>{currentUserData.following}</span>
                <span style={styles.statLabel}>Following</span>
              </div>
            </div>
          </div>

          <SuggestedUsers
            users={suggestedUsers}
            posts={posts}
            onToggleFollow={(userId) => {
              setPosts((prev) =>
                prev.map((post) =>
                  post.author.uid === userId
                    ? {
                        ...post,
                        author: {
                          ...post.author,
                          isFollowing: !post.author.isFollowing
                        }
                      }
                    : post
                )
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    marginLeft: "70px",
    minHeight: "100vh",
    backgroundColor: "#0a0a0a",
    color: "#fff"
  },
  contentWrapper: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  feed: {
    flex: 1,
    maxWidth: "650px"
  },
  feedHeader: {
    marginBottom: "30px",
    padding: "20px 0"
  },
  feedTitle: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#fff"
  },
  feedSubtitle: {
    fontSize: "16px",
    color: "#888",
    lineHeight: "1.5"
  },
  loadingState: {
    textAlign: "center",
    padding: "40px",
    color: "#aaa",
    fontSize: "18px"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    border: "1px solid #333"
  },
  "emptyState h3": {
    fontSize: "24px",
    marginBottom: "10px",
    color: "#fff"
  },
  "emptyState p": {
    color: "#888",
    fontSize: "16px"
  },
  postsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  sidebar: {
    width: "320px",
    position: "sticky",
    top: "30px",
    height: "fit-content"
  },
  profileCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
    border: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "16px"
  },
  profileInfo: {
    marginBottom: "20px"
  },
  profileName: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "4px",
    color: "#fff"
  },
  profileHandle: {
    fontSize: "14px",
    color: "#888"
  },
  profileStats: {
    display: "flex",
    gap: "30px",
    width: "100%",
    justifyContent: "center"
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  statNumber: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff"
  },
  statLabel: {
    fontSize: "12px",
    color: "#888",
    marginTop: "2px"
  }
};

export default HomeFeed;