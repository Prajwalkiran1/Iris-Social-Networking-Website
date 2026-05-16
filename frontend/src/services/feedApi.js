import { apiGet } from "./apiClient";

// Personalized feed for the authenticated user (uid derived from the token
// server-side). Throws on failure so the caller can show a real error state.
export const getFeed = () => apiGet("/feed");
