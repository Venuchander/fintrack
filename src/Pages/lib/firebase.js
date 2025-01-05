// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfRdxmjoD8E4p5_iI5EhYDd3SbF6oSFpE",
  authDomain: "fintrack-e16d2.firebaseapp.com",
  projectId: "fintrack-e16d2",
  storageBucket: "fintrack-e16d2.firebasestorage.app",
  messagingSenderId: "86110773640",
  appId: "1:86110773640:web:f5842b39ee383458249a3d",
  measurementId: "G-DTMLDQQJPJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);