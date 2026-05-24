import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAsRCmmptBEEz29pJ9_3qhgvpYWvthpXGU",
  authDomain: "virtualcloset-bfe0f.firebaseapp.com",
  projectId: "virtualcloset-bfe0f",
  storageBucket: "virtualcloset-bfe0f.firebasestorage.app",
  messagingSenderId: "412817871955",
  appId: "1:412817871955:web:3ee0bb12d41c4aa2c3e2a6",
  measurementId: "G-K0BWC3GZLM"

};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
