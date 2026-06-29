// ============================================================
// LibraVault — Firebase Configuration
// Project: LibraryManagementSystem (librarymanagementsystem-3fe9c)
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAn9AfLkCTPN0l9tOREyhD0qtR9PfW20oI",
  authDomain: "librarymanagementsystem-3fe9c.firebaseapp.com",
  projectId: "librarymanagementsystem-3fe9c",
  storageBucket: "librarymanagementsystem-3fe9c.firebasestorage.app",
  messagingSenderId: "295288140881",
  appId: "1:295288140881:web:68ae24c8d4ac81c8d57470",
  measurementId: "G-XWYE77VKDL"
};

// Initialize Firebase (compat SDK — works with CDN script tags)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Global references used across all pages
const db   = firebase.firestore();
const auth = firebase.auth();
