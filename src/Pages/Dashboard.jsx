import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./lib/firebase";
import { useTranslation } from 'react-i18next'
import { getUserData, updateExpense, deleteExpense, restoreExpense } from "./lib/userService";
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
  Legend,
} from "chart.js";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import Sidebar from "../components/components/Sidebar";
import ProfileButton from "../components/components/profile";
import BankAccounts from "../components/components/bankAccounts";
import CreditCards from "../components/components/creditCards";
import FinancialCharts from "../components/components/financialCharts";
import RecentTransactions from "../components/components/recentTransactions";
import MonthlyExpenseChart from "../components/components/MonthlyExpenseCharts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSidebar } from "../contexts/SidebarContext";

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
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar();
  const { t } = useTranslation();

  useEffect(() => {
    const handleOffline = () => {
      toast.error("You're offline. Please check your Internet Connection.", {
        toastId: "offline-toast",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      });
    };

    const handleOnline = () => {
      toast.dismiss("offline-toast");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        try {
          const data = await getUserData(user.uid);
          if (data?.accounts) {
            const processedAccounts = data.accounts.reduce((acc, account) => {
              if (
                account.type === "Cash" ||
                account.name.toLowerCase() === "cash"
              ) {
                const existingCashIndex = acc.findIndex(
                  (a) => a.type === "Cash" || a.name.toLowerCase() === "cash"
                );

                if (existingCashIndex !== -1) {
                  acc[existingCashIndex] = {
                    ...acc[existingCashIndex],
                    balance: acc[existingCashIndex].balance + account.balance,
                    recurringAmount:
                      (acc[existingCashIndex].recurringAmount || 0) +
                      (account.recurringAmount || 0),
                    isRecurringIncome:
                      acc[existingCashIndex].isRecurringIncome ||
                      account.isRecurringIncome,
                  };
                } else {
                  acc.push(account);
                }
              } else {
                acc.push(account);
              }
              return acc;
            }, []);

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
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle updating transactions
  const handleUpdateTransaction = async (updatedTransaction) => {
    if (!user) return;

    try {
      await updateExpense(user.uid, updatedTransaction);
      // Refresh user data
      const data = await getUserData(user.uid);
      setUserData(data);
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  };

  // Handle deleting transactions
  const handleDeleteTransaction = async (transaction) => {
    if (!user) return;

    try {
      await deleteExpense(user.uid, transaction.id);
      // Refresh user data
      const data = await getUserData(user.uid);
      setUserData(data);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  };

  // Handle restoring transactions
  const handleRestoreTransaction = async (transaction) => {
    if (!user) return;

    try {
      console.log('Dashboard: Attempting to restore transaction:', transaction);
      await restoreExpense(user.uid, transaction);
      // Refresh user data
      const data = await getUserData(user.uid);
      setUserData(data);
      console.log('Dashboard: Transaction restored successfully');
    } catch (error) {
      console.error("Dashboard: Error restoring transaction:", error);
      throw error;
    }
  };

  // Handle refreshing transactions
  const handleRefreshTransactions = async () => {
    if (!user) return;

    try {
      const data = await getUserData(user.uid);
      setUserData(data);
    } catch (error) {
      console.error("Error refreshing transactions:", error);
    }
  };

  const getCardBackground = (cardType) => {
    const types = {
      visa: "from-[#1A1F71] to-[#4B1F71]",
      mastercard: "from-[#EB001B] to-[#F79E1B]",
      rupay: "from-[#097DC6] to-[#9C27B0]",
      amex: "from-[#006FCF] to-[#00AEEF]",
      discover: "from-[#FF6000] to-[#FFA500]",
    };
    return types[cardType?.toLowerCase()] || "from-gray-700 to-gray-900";
  };

  const calculateMonthlyFinances = () => {
    if (!userData?.expenses || !userData?.accounts)
      return { income: 0, expenses: 0, recurringIncome: 0 };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const recurringIncome = userData.accounts.reduce((sum, account) => {
      return sum + (account.isRecurringIncome ? account.recurringAmount : 0);
    }, 0);

    const monthlyTransactions = userData.expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });

    const { income: monthlyIncome, expenses: monthlyExpenses } =
      monthlyTransactions.reduce(
        (acc, transaction) => {
          if (
            transaction.paymentType === "credit" ||
            transaction.paymentType === "income"
          ) {
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
      recurringIncome,
    };
  };


  const prepareExpenseData = () => {
    if (!userData?.expenses) return null;

    const categories = {};
    userData.expenses.forEach((expense) => {
      categories[expense.category] =
        (categories[expense.category] || 0) + expense.amount;
    });

    const total = Object.values(categories).reduce(
      (sum, amount) => sum + amount,
      0
    );
    const percentages = Object.entries(categories).map(
      ([category, amount]) => ({
        category,
        percentage: ((amount / total) * 100).toFixed(1),
      })
    );

    return {
      labels: percentages.map((item) => item.category),
      datasets: [
        {
          data: percentages.map((item) => item.percentage),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#7CFC00",
            "#FF69B4",
          ],
        },
      ],
    };
  };

  const prepareIncomeVsExpenseData = () => {
    if (!userData?.expenses) return null;

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const currentMonth = new Date().getMonth();
    const startMonth = currentMonth - 5;

    const monthlyData = Array(6)
      .fill(0)
      .map((_, index) => {
        const month = (startMonth + index + 12) % 12;
        const year = new Date().getFullYear() - (month > currentMonth ? 1 : 0);

        const monthTransactions = userData.expenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getMonth() === month &&
            expenseDate.getFullYear() === year
          );
        });

        const recurringIncome = userData.accounts.reduce((sum, account) => {
          return (
            sum + (account.isRecurringIncome ? account.recurringAmount : 0)
          );
        }, 0);

        const expenses = monthTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );

        return { month: monthLabels[month], income: recurringIncome, expenses };
      });

    return {
      labels: monthlyData.map((d) => d.month),
      datasets: [
        {
          label: "Income",
          data: monthlyData.map((d) => d.income),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
        {
          label: "Expense",
          data: monthlyData.map((d) => d.expenses),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    };
  };


  // const getSavingsProgress = () => {
  //   if (!userData?.userDetails?.savingsGoal)
  //     return {
  //       current: 0,
  //       goal: 10000,
  //       percentage: 0,
  //     };

  //   const monthlyGoal = userData.userDetails.savingsGoal;
  //   const totalBalance = userData.userDetails.totalBalance || 0;
  //   const progressPercentage = Math.min(
  //     (totalBalance / monthlyGoal) * 100,
  //     100
  //   );

  //   return {
  //     current: totalBalance,
  //     goal: monthlyGoal,
  //     percentage: progressPercentage,
  //   };
  // };


  const getAllTransactions = () => {
    if (!userData?.expenses || !userData?.accounts) return [];

    const incomeTransactions = userData.accounts.flatMap((account) => {
      const transactions = [];

      if (account.balance > 0) {
        transactions.push({
          description: `Balance from ${account.name}`,
          category: account.type || "Income",
          amount: account.balance,
          date: account.updatedAt || new Date().toISOString(),
          paymentType: "income",
          accountType: account.type,
          isIncome: true,
        });
      }

      if (account.isRecurringIncome && account.recurringAmount > 0) {
        transactions.push({
          description: `Recurring Income from ${account.name}`,
          category: account.type || "Income",
          amount: account.recurringAmount,
          date: new Date().toISOString(),
          paymentType: "income",
          accountType: account.type,
          isIncome: true,
        });
      }

      return transactions;
    });

    const expenseTransactions = userData.expenses.map((transaction) => ({
      ...transaction,
      isIncome: false,
    }));

    const allTransactions = [...incomeTransactions, ...expenseTransactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((transaction) => ({
        ...transaction,
        displayAmount: transaction.isIncome
          ? `+${formatCurrency(transaction.amount)}`
          : `-${formatCurrency(transaction.amount)}`,
        category: transaction.isIncome
          ? `${transaction.category} ${
              transaction.accountType ? `(${transaction.accountType})` : ""
            }`
          : transaction.category,
      }));

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
  const expenseData = prepareExpenseData();
  const incomeVsExpenseData = prepareIncomeVsExpenseData();
  const allTransactions = getAllTransactions();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeSidebar}
        />
      )}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        user={user}
      />

      {/* ✅ Header */}
   
   <header className="relative z-10 bg-white dark:bg-gray-800 shadow-sm transition-colors">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center py-4 relative">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {t('dashboard.title')}
      </h2>
      <div className="absolute right-0 flex items-center space-x-4">
        <ProfileButton
          user={user}
          onMenuToggle={toggleSidebar}
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
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.cards.totalBalance')}
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.cards.monthlyIncome')}
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.cards.monthlyExpenses')}
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.cards.savingsGoal')}
                </CardTitle>
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

          {/* monthly expense comparision Chart Component */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.charts.monthlyExpenseComparison')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyExpenseChart expenses={userData?.expenses} t={t} />
            </CardContent>
          </Card>

          {/* Recent Transactions Component */}
          <RecentTransactions
            transactions={allTransactions}
            selectedTransactionType={selectedTransactionType}
            setSelectedTransactionType={setSelectedTransactionType}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onRestoreTransaction={handleRestoreTransaction}
            onRefreshTransactions={handleRefreshTransactions}
          />
        </div>

      </main>

      <ToastContainer position="top-center" />
    </div>
  );
}

export default Dashboard;
