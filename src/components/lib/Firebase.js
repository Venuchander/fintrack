import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBslQ0vjSLV35paDXoTuNSPR2U7GIeeX6o",
  authDomain: "fintrack-6fe3b.firebaseapp.com",
  projectId: "fintrack-6fe3b",
  storageBucket: "fintrack-6fe3b.firebasestorage.app",
  messagingSenderId: "393802535438",
  appId: "1:393802535438:web:5583fa49298dd3351fa25f",
  measurementId: "G-TWV1GKGCVJ"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
