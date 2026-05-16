import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";

// Single entry point for all backend calls. Attaches a fresh Firebase ID token
// on every request (Firebase caches/refreshes internally — don't cache it
// ourselves). On 401 the session is signed out so the app returns to login.
//
// Base URL is /api in dev (Vite proxy → :5001) and the absolute backend URL in
// production (set VITE_API_BASE_URL at build time).
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(method, path, body) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }

  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    await signOut(auth).catch(() => {});
    throw new Error("Session expired");
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error || "";
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const apiGet = (path) => request("GET", path);
export const apiPost = (path, body) => request("POST", path, body ?? {});
export const apiPut = (path, body) => request("PUT", path, body ?? {});
