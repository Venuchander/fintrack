import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./lib/firebase";
import { getUserData } from "./lib/userService";
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Target
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Sidebar from "../components/components/Sidebar";
import ProfileButton from '../components/components/profile';
import BankAccounts from "../components/components/bankAccounts";
import CreditCards from "../components/components/creditCards";
import FinancialCharts from '../components/components/FinancialCharts';
import RecentTransactions from '../components/components/RecentTransactions';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransactionType, setSelectedTransactionType] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        try {
          const data = await getUserData(user.uid);
          // Process accounts to combine cash accounts
          if (data?.accounts) {
            const processedAccounts = data.accounts.reduce((acc, account) => {
              if (account.type === "Cash" || account.name.toLowerCase() === "cash") {
                // Find existing cash account
                const existingCashIndex = acc.findIndex(a => 
                  a.type === "Cash" || a.name.toLowerCase() === "cash"
                );

                if (existingCashIndex !== -1) {
                  // Update existing cash account
                  acc[existingCashIndex] = {
                    ...acc[existingCashIndex],
                    balance: acc[existingCashIndex].balance + account.balance,
                    // Combine recurring amounts if present
                    recurringAmount: (acc[existingCashIndex].recurringAmount || 0) + 
                                   (account.recurringAmount || 0),
                    isRecurringIncome: acc[existingCashIndex].isRecurringIncome || 
                                     account.isRecurringIncome
                  };
                } else {
                  // Add new cash account
                  acc.push(account);
                }
              } else {
                // Add non-cash account as is
                acc.push(account);
              }
              return acc;
            }, []);

            // Update the data with processed accounts
            data.accounts = processedAccounts;
          }
          setUserData(data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        navigate("/login");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCardBackground = (cardType) => {
    const types = {
      visa: 'from-[#1A1F71] to-[#4B1F71]',
      mastercard: 'from-[#EB001B] to-[#F79E1B]',
      rupay: 'from-[#097DC6] to-[#9C27B0]',
      amex: 'from-[#006FCF] to-[#00AEEF]',
      discover: 'from-[#FF6000] to-[#FFA500]'
    };
    return types[cardType?.toLowerCase()] || 'from-gray-700 to-gray-900';
  };

  const calculateMonthlyFinances = () => {
    if (!userData?.expenses || !userData?.accounts) return { 
      income: 0, 
      expenses: 0, 
      recurringIncome: 0 
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate recurring income from accounts
    const recurringIncome = userData.accounts.reduce((sum, account) => {
      return sum + (account.isRecurringIncome ? account.recurringAmount : 0);
    }, 0);

    const monthlyTransactions = userData.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });

    // Sum all transactions for expenses (positive amounts are expenses in your structure)
    const { income: monthlyIncome, expenses: monthlyExpenses } = monthlyTransactions.reduce(
      (acc, transaction) => {
        if (transaction.paymentType === "credit" || transaction.paymentType === "income") {
          acc.income += transaction.amount;
        } else {
          acc.expenses += transaction.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );

    return { 
      income: monthlyIncome + recurringIncome, 
      expenses: monthlyExpenses,
      recurringIncome 
    };
  };

  const prepareExpenseData = () => {
    if (!userData?.expenses) return null;

    const categories = {};
    userData.expenses.forEach(expense => {
      categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
    const percentages = Object.entries(categories).map(([category, amount]) => ({
      category,
      percentage: ((amount / total) * 100).toFixed(1)
    }));

    return {
      labels: percentages.map(item => item.category),
      datasets: [{
        data: percentages.map(item => item.percentage),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
          '#FF9F40', '#7CFC00', '#FF69B4'
        ]
      }]
    };
  };

  const prepareIncomeVsExpenseData = () => {
    if (!userData?.expenses) return null;

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    const startMonth = currentMonth - 5;
    
    const monthlyData = Array(6).fill(0).map((_, index) => {
      const month = (startMonth + index + 12) % 12;
      const year = new Date().getFullYear() - (month > currentMonth ? 1 : 0);
      
      const monthTransactions = userData.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && 
               expenseDate.getFullYear() === year;
      });

      const recurringIncome = userData.accounts.reduce((sum, account) => {
        return sum + (account.isRecurringIncome ? account.recurringAmount : 0);
      }, 0);

      const expenses = monthTransactions
        .reduce((sum, t) => sum + t.amount, 0);

      return { month: monthLabels[month], income: recurringIncome, expenses };
    });

    return {
      labels: monthlyData.map(d => d.month),
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(d => d.income),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Expense',
          data: monthlyData.map(d => d.expenses),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getSavingsProgress = () => {
    if (!userData?.userDetails?.savingsGoal) return {
      current: 0,
      goal: 10000,
      percentage: 0
    };
    
    const monthlyGoal = userData.userDetails.savingsGoal;
    const totalBalance = userData.userDetails.totalBalance || 0;
    const progressPercentage = Math.min((totalBalance / monthlyGoal) * 100, 100);
    
    return {
      current: totalBalance,
      goal: monthlyGoal,
      percentage: progressPercentage
    };
  };

  const getFilteredTransactions = () => {
    if (!userData?.expenses || !userData?.accounts) return [];
    
    // Get all income transactions from accounts (bank, cash, credit, recurring)
    const incomeTransactions = userData.accounts
      .flatMap(account => {
        const transactions = [];

        // Add regular balance as income if it's positive
        if (account.balance > 0) {
          transactions.push({
            description: `Balance from ${account.name}`,
            category: account.type || 'Income',
            amount: account.balance,
            date: account.updatedAt || new Date().toISOString(),
            paymentType: 'income',
            accountType: account.type,
            isIncome: true
          });
        }

        // Add recurring income if present
        if (account.isRecurringIncome && account.recurringAmount > 0) {
          transactions.push({
            description: `Recurring Income from ${account.name}`,
            category: account.type || 'Income',
            amount: account.recurringAmount,
            date: new Date().toISOString(),
            paymentType: 'income',
            accountType: account.type,
            isIncome: true
          });
        }

        return transactions;
      });

    // Get expense transactions
    const expenseTransactions = userData.expenses.map(transaction => ({
      ...transaction,
      isIncome: false
    }));

    // Combine and sort all transactions
    const allTransactions = [...incomeTransactions, ...expenseTransactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter(transaction => {
        if (selectedTransactionType === "all") return true;
        if (selectedTransactionType === "income") return transaction.isIncome;
        if (selectedTransactionType === "expense") return !transaction.isIncome;
        return true;
      })
      .map(transaction => ({
        ...transaction,
        displayAmount: transaction.isIncome
          ? `+${formatCurrency(transaction.amount)}`
          : `-${formatCurrency(transaction.amount)}`,
        // Format category to show account type for income
        category: transaction.isIncome 
          ? `${transaction.category} ${transaction.accountType ? `(${transaction.accountType})` : ''}`
          : transaction.category
      }))
      .slice(0, 5);

    return allTransactions;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const { income, expenses, recurringIncome } = calculateMonthlyFinances();
  const savingsProgress = getSavingsProgress();
  const expenseData = prepareExpenseData();
  const incomeVsExpenseData = prepareIncomeVsExpenseData();
  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="min-h-screen bg-gray-100">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)} />
      )}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </Button>
              <ProfileButton
                user={user}
                onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onLogout={() => auth.signOut()}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(userData?.totalBalance || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(income)}
                </div>
                {recurringIncome > 0 && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    {/* <ArrowUpRight className="h-4 w-4 mr-1" />
                    Passive Income: {formatCurrency(recurringIncome)} */}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(expenses)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Savings Goal</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(userData?.savingsGoal || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Accounts Components */}
          {userData?.accounts && (
            <>
              <BankAccounts 
                accounts={userData.accounts} 
                formatCurrency={formatCurrency} 
              />
              
              <CreditCards 
                accounts={userData.accounts}
                formatCurrency={formatCurrency}
                getCardBackground={getCardBackground}
              />
            </>
          )}

          {/* Charts Component */}
          <FinancialCharts 
            incomeVsExpenseData={incomeVsExpenseData} 
            expenseData={expenseData} 
          />

          {/* Recent Transactions Component */}
          <RecentTransactions 
            transactions={filteredTransactions}
            selectedTransactionType={selectedTransactionType}
            setSelectedTransactionType={setSelectedTransactionType}
          />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;