import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const createOrUpdateUser = async (uid, userData) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing user data
      await setDoc(userRef, {
        ...userDoc.data(),
        ...userData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } else {
      // Create new user
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Error managing user data:", error);
    throw error;
  }
};