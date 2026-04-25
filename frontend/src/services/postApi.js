import axios from "axios";

const API = "/api";

export const createPost = async (postData) => {
  try {
    const res = await fetch(`${API}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
    
    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    console.error("Error creating post:", err);
    // Return mock post if backend is not available
    return {
      id: Date.now().toString(),
      content: postData.content,
      imageUrl: postData.imageUrl,
      timestamp: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
      author: {
        uid: postData.uid,
        name: "Current User",
        isFollowing: false
      }
    };
  }
};