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

    let account = null;
    
    // Handle cash transactions
    if (expenseData.paymentMethod === "cash") {
      // Look for existing cash account
      account = accounts.find(acc => acc.type === "Cash") || {
        name: "cash",
        type: "Cash",
        balance: 0
      };
      
      // Override paymentType for cash transactions
      expenseData.paymentType = "cash";
    } else {
      // Find the corresponding account for non-cash payments
      account = accounts.find(
        (acc) => acc.name === expenseData.paymentMethod
      );

      if (!account) {
        throw new Error("Account not found");
      }
    }

    // Create expense record
    const expense = {
      ...expenseData,
      id: Date.now().toString(),
      accountName: account.name,
      accountType: account.type,
      amount: Number(expenseData.amount),
      createdAt: new Date().toISOString(),
      paymentType: expenseData.paymentMethod === "cash" ? "cash" : expenseData.paymentType
    };

    expenses.push(expense);

    // Update accounts including cash
    let updatedAccounts;
    if (expenseData.paymentMethod === "cash") {
      // If cash account exists, update it; if not, add it
      const cashAccountExists = accounts.some(acc => acc.type === "Cash");
      if (cashAccountExists) {
        updatedAccounts = accounts.map(acc => {
          if (acc.type === "Cash") {
            return {
              ...acc,
              balance: Number(acc.balance) - Number(expenseData.amount)
            };
          }
          return acc;
        });
      } else {
        // Add new cash account with initial balance minus the expense
        updatedAccounts = [
          ...accounts,
          {
            name: "cash",
            type: "Cash",
            balance: -Number(expenseData.amount)
          }
        ];
      }
    } else {
      // Handle non-cash accounts
      updatedAccounts = accounts.map((acc) => {
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
    }

    // Recalculate total balance including all accounts
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

export const updateExpense = async (uid, updatedExpense) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    const expenses = userData.expenses || [];
    const accounts = userData.accounts || [];

    // Find the expense to update
    const expenseIndex = expenses.findIndex(exp => exp.id === updatedExpense.id);
    if (expenseIndex === -1) {
      throw new Error("Expense not found");
    }

    const originalExpense = expenses[expenseIndex];

    // Calculate the difference to adjust account balances
    const amountDifference = Number(updatedExpense.amount) - Number(originalExpense.amount);

    // Update the expense
    expenses[expenseIndex] = {
      ...originalExpense,
      ...updatedExpense,
      amount: Number(updatedExpense.amount),
      updatedAt: new Date().toISOString(),
    };

    // Update account balances if the amount changed or payment method changed
    let updatedAccounts = [...accounts];
    
    if (amountDifference !== 0 || originalExpense.paymentMethod !== updatedExpense.paymentMethod) {
      // Revert original transaction effect
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.name === originalExpense.paymentMethod || 
            (originalExpense.paymentMethod === "cash" && acc.type === "Cash")) {
          return {
            ...acc,
            balance: acc.type === "Credit"
              ? Number(acc.balance) - Number(originalExpense.amount)
              : Number(acc.balance) + Number(originalExpense.amount),
          };
        }
        return acc;
      });

      // Apply new transaction effect
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.name === updatedExpense.paymentMethod || 
            (updatedExpense.paymentMethod === "cash" && acc.type === "Cash")) {
          return {
            ...acc,
            balance: acc.type === "Credit"
              ? Number(acc.balance) + Number(updatedExpense.amount)
              : Number(acc.balance) - Number(updatedExpense.amount),
          };
        }
        return acc;
      });
    }

    // Recalculate total balance
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

    return { accounts: updatedAccounts, totalBalance, expense: expenses[expenseIndex] };
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (uid, expenseId) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    const expenses = userData.expenses || [];
    const accounts = userData.accounts || [];

    // Find the expense to delete
    const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
    if (expenseIndex === -1) {
      throw new Error("Expense not found");
    }

    const expenseToDelete = expenses[expenseIndex];

    // Remove the expense
    const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);

    // Revert the account balance changes
    let updatedAccounts = accounts.map((acc) => {
      if (acc.name === expenseToDelete.paymentMethod || 
          (expenseToDelete.paymentMethod === "cash" && acc.type === "Cash")) {
        return {
          ...acc,
          balance: acc.type === "Credit"
            ? Number(acc.balance) - Number(expenseToDelete.amount)
            : Number(acc.balance) + Number(expenseToDelete.amount),
        };
      }
      return acc;
    });

    // Recalculate total balance
    const totalBalance = updatedAccounts.reduce(
      (sum, acc) => sum + Number(acc.balance),
      0
    );

    // Update Firebase
    await setDoc(
      userRef,
      {
        accounts: updatedAccounts,
        expenses: updatedExpenses,
        totalBalance,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { accounts: updatedAccounts, totalBalance, deletedExpense: expenseToDelete };
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

export const restoreExpense = async (uid, expenseData) => {
  try {
    // Use the same logic as addExpense but with the restored data
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    const expenses = userData.expenses || [];
    const accounts = userData.accounts || [];

    let account = null;
    
    // Handle cash transactions
    if (expenseData.paymentMethod === "cash") {
      // Look for existing cash account
      account = accounts.find(acc => acc.type === "Cash") || {
        name: "cash",
        type: "Cash",
        balance: 0
      };
    } else {
      // Find the corresponding account for non-cash payments
      account = accounts.find(
        (acc) => acc.name === expenseData.paymentMethod || acc.name === expenseData.accountName
      );

      if (!account) {
        throw new Error("Account not found");
      }
    }

    // Create expense record with new ID
    const restoredExpense = {
      ...expenseData,
      id: Date.now().toString(),
      accountName: account.name,
      accountType: account.type,
      amount: Number(expenseData.amount),
      createdAt: new Date().toISOString(),
      restoredAt: new Date().toISOString(),
    };

    expenses.push(restoredExpense);

    // Update accounts
    let updatedAccounts;
    if (expenseData.paymentMethod === "cash") {
      // Handle cash account
      const cashAccountExists = accounts.some(acc => acc.type === "Cash");
      if (cashAccountExists) {
        updatedAccounts = accounts.map(acc => {
          if (acc.type === "Cash") {
            return {
              ...acc,
              balance: Number(acc.balance) - Number(expenseData.amount)
            };
          }
          return acc;
        });
      } else {
        // Add new cash account
        updatedAccounts = [
          ...accounts,
          {
            name: "cash",
            type: "Cash",
            balance: -Number(expenseData.amount)
          }
        ];
      }
    } else {
      // Handle non-cash accounts
      updatedAccounts = accounts.map((acc) => {
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
    }

    // Recalculate total balance
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

    return { accounts: updatedAccounts, totalBalance, expense: restoredExpense };
  } catch (error) {
    console.error("Error restoring expense:", error);
    throw error;
  }
};
