
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuSlAPAoac1G09QxSiNu1GftbFEey_t04",
  authDomain: "studio-6626988801-efcc1.firebaseapp.com",
  projectId: "studio-6626988801-efcc1",
  storageBucket: "studio-6626988801-efcc1.firebasestorage.app",
  messagingSenderId: "49894771803",
  appId: "1:49894771803:web:7f89ae68e2508ab113437e"
};


// Initialize Firebase
// Mencegah inisialisasi ulang di Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
