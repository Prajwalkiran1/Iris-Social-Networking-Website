import axios from "axios";

const API = "/api";

export const getFeed = async (userId) => {
  try {
    const res = await fetch(`${API}/feed/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    console.error("Error fetching feed:", err);
    // Return mock data if backend is not available
    return [
      {
        id: "mock-1",
        content: "Welcome to Iris! Your social networking platform.",
        imageUrl: null,
        likeCount: 5,
        timestamp: new Date().toISOString(),
        isLiked: false,
        author: {
          uid: "demo-user-1",
          name: "Demo User",
          isFollowing: false
        }
      },
      {
        id: "mock-2",
        content: "This is a sample post to show how the feed works.",
        imageUrl: null,
        likeCount: 3,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isLiked: false,
        author: {
          uid: "demo-user-2",
          name: "Another User",
          isFollowing: false
        }
      }
    ];
  }
};