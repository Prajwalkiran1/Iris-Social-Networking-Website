import { apiPost } from "./apiClient";

// Author is derived from the auth token server-side; only send content/image.
export const createPost = ({ content, imageUrl }) =>
  apiPost("/posts", { content, imageUrl: imageUrl || "" });

export const toggleLike = (postId) => apiPost(`/posts/${postId}/like`);
