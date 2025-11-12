
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBasnrJUE_koywGMUmlqCWVl2Zfcy0wejU",
  authDomain: "tanyaaviasi.firebaseapp.com",
  projectId: "tanyaaviasi",
  storageBucket: "tanyaaviasi.firebasestorage.app",
  messagingSenderId: "705763540547",
  appId: "1:705763540547:web:c2a8958cc5932c9947def6",
  measurementId: "G-STKZX0SWRT"
};

// Initialize Firebase
// Mencegah inisialisasi ulang di Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
