import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCfTuA_WyuTGVLo_H_y2fim6tBleoFxQcY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "g-r-i-c-c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "g-r-i-c-c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "g-r-i-c-c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "55103679270",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:55103679270:web:c7bd6da92e72457af16fe7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXC0KY9SDJ"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
