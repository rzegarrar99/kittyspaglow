import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { env, isFirebaseConfigured } from '../config/env';

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializamos Firebase
export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

// ⚠️ CORRECCIÓN CRÍTICA: Le decimos a Firestore que use la base de datos "spaglowkittywost"
export const db = isFirebaseConfigured ? getFirestore(app!, "spaglowkittywost") : null as any;

export const auth = isFirebaseConfigured ? getAuth(app!) : null as any;

// Proveedor de Google
export const googleProvider = new GoogleAuthProvider();

// Analytics solo se inicializa si estamos en el navegador
export const analytics = isFirebaseConfigured && typeof window !== 'undefined' ? getAnalytics(app!) : null;
