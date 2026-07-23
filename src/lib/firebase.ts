import { initializeApp, getApp, getApps } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLSPDMLJXKZEFVx2ATWwwyJCg3rptp71U",
  authDomain: "inve-d09c5.firebaseapp.com",
  projectId: "inve-d09c5",
  storageBucket: "inve-d09c5.firebasestorage.app",
  messagingSenderId: "711634590609",
  appId: "1:711634590609:web:977582d9731eabc7dbd830",
  measurementId: "G-6MSDJCB77X",
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

if (typeof window !== "undefined") {
  void setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn("Nao foi possivel ativar persistencia de auth:", error);
  });
}
