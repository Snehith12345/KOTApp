import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCi43nwuvGPykdJUFvUTjiqUwT_imWsiWw",
  authDomain: "vasudha-656ee.firebaseapp.com",
  projectId: "vasudha-656ee",
  storageBucket: "vasudha-656ee.firebasestorage.app",
  messagingSenderId: "162894039737",
  appId: "1:162894039737:web:da76880d81fbb046e26968",
  measurementId: "G-RLWVJE3BT2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
