
import * as admin from 'firebase-admin';

// Ambil konfigurasi dari environment variables yang disediakan oleh Firebase
const firebaseConfig = {
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Mencegah inisialisasi ulang di Next.js
if (!admin.apps.length) {
    admin.initializeApp(firebaseConfig, 'admin');
}

export const adminApp = admin.app('admin');
export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);
