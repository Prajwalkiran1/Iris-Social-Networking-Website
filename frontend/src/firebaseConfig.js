// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCQ8a_vI5to1npbLxLGzq_L0iYJx09kPPk",
  authDomain: "social-networking-d9f2a.firebaseapp.com",
  projectId: "social-networking-d9f2a",
  storageBucket: "social-networking-d9f2a.firebasestorage.app",
  messagingSenderId: "633019413525",
  appId: "1:633019413525:web:8fec4010e2357eb6630a1c",
  measurementId: "G-TPX4CRXYG1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
