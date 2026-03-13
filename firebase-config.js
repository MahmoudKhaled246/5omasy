// ============================================================
//  🔥 firebase-config.js
//  ضع هنا بيانات مشروعك من Firebase Console
//  Project Settings → Your apps → Firebase SDK snippet
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ⬇️ استبدل الأرقام دي ببيانات مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyC5ruV057q2rdH04-QluyH_eeSDd1vKBnk",
  authDomain: "el5omasy.firebaseapp.com",
  projectId: "el5omasy",
  storageBucket: "el5omasy.firebasestorage.app",
  messagingSenderId: "678208322207",
  appId: "1:678208322207:web:a7536a1b65cf004167c0aa",
  measurementId: "G-NRJWX05VG9",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
