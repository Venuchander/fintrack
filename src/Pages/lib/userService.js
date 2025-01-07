import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const createOrUpdateUser = async (uid, userData) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      await setDoc(
        userRef,
        {
          ...userDoc.data(),
          ...userData,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      await setDoc(userRef, {
        ...userData,
        accounts: [],
        totalBalance: 0,
        expenses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

    // Serialize accounts with proper structure
    const serializedAccounts = accounts.map((account) => {
      const baseAccount = {
        type: account.type,
        name: account.name,
        balance: Number(account.balance),
        isRecurringIncome: Boolean(account.isRecurringIncome),
        recurringAmount: Number(account.recurringAmount || 0),
      };

      if (account.type === "Credit") {
        return {
          ...baseAccount,
          cardType: account.cardType,
          expiryDate: account.expiryDate,
          creditAmount: Number(account.creditAmount),
        };
      }

      if (account.type === "Bank") {
        return {
          ...baseAccount,
          bankName: account.name, // Store original bank name
        };
      }

      return baseAccount;
    });

    // Calculate total balance including credit accounts
    const totalBalance = serializedAccounts.reduce(
      (sum, account) => sum + Number(account.balance),
      0
    );

    await setDoc(
      userRef,
      {
        accounts: serializedAccounts,
        totalBalance,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { accounts: serializedAccounts, totalBalance };
  } catch (error) {
    console.error("Error updating accounts:", error);
    throw error;
  }
};

export const addExpense = async (uid, expenseData) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    const expenses = userData.expenses || [];
    const accounts = userData.accounts || [];

    // Find the corresponding account
    const account = accounts.find(
      (acc) => acc.name === expenseData.paymentMethod
    );

    if (!account) {
      throw new Error("Account not found");
    }

    // Create expense record
    const expense = {
      ...expenseData,
      id: Date.now().toString(),
      accountName: account.name,
      accountType: account.type,
      amount: Number(expenseData.amount),
      createdAt: new Date().toISOString(),
    };

    expenses.push(expense);

    // Update account balance based on account type
    const updatedAccounts = accounts.map((acc) => {
      if (acc.name === account.name) {
        return {
          ...acc,
          balance:
            acc.type === "Credit"
              ? Number(acc.balance) + Number(expenseData.amount)
              : Number(acc.balance) - Number(expenseData.amount),
        };
      }
      return acc;
    });

    // Recalculate total balance including credit accounts
    const totalBalance = updatedAccounts.reduce(
      (sum, acc) => sum + Number(acc.balance),
      0
    );

    // Update Firebase
    await setDoc(
      userRef,
      {
        accounts: updatedAccounts,
        expenses,
        totalBalance,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { accounts: updatedAccounts, totalBalance, expense };
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
