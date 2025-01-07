import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const createOrUpdateUser = async (uid, userData) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await setDoc(userRef, {
        ...userDoc.data(),
        ...userData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } else {
      await setDoc(userRef, {
        ...userData,
        accounts: [], // Initialize empty accounts array
        expenses: [], // Initialize empty expenses array
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Error managing user data:", error);
    throw error;
  }
};

export const updateUserAccounts = async (uid, accounts) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      accounts,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating accounts:", error);
    throw error;
  }
};

export const addExpense = async (uid, expense) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const expenses = userData.expenses || [];
      expenses.push({
        ...expense,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      });
      
      await setDoc(userRef, {
        expenses,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};