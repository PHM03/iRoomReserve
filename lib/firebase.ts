// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAloRS-cQZ0jJvN3JrA3m_5Wm4xXrMwYFE",
  authDomain: "iroomreserve.firebaseapp.com",
  projectId: "iroomreserve",
  storageBucket: "iroomreserve.firebasestorage.app",
  messagingSenderId: "735804203844",
  appId: "1:735804203844:web:b166e2f182e29d367b6d11",
  measurementId: "G-6PQBSMRE8L",
};

// Initialize Firebase (prevent duplicate initialization on hot reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Analytics (only runs in the browser, not during server-side rendering)
const analytics =
  typeof window !== "undefined"
    ? isSupported().then((yes) => (yes ? getAnalytics(app) : null))
    : null;

export { app, auth, db, rtdb, analytics };
