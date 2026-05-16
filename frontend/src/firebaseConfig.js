// Firebase web config is read from environment (Vite `VITE_*` vars) instead of
// being hardcoded. Copy frontend/.env.example to frontend/.env.local and fill in
// the values from YOUR Firebase project:
//   Firebase console -> Project settings -> General -> "Your apps" -> SDK setup.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([k, v]) => !v && k !== "measurementId")
  .map(([k]) => k);

if (missing.length) {
  throw new Error(
    `Missing Firebase config: ${missing.join(", ")}. ` +
      `Create frontend/.env.local from .env.example (Firebase console -> Project settings).`
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
