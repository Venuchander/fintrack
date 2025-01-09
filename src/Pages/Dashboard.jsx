import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "./lib/firebase"
import { getUserData } from "./lib/userService"
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
} from 'chart.js'
import { Bar, Doughnut, Line } from "react-chartjs-2"
import { 
  DollarSign, 
  PieChart, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  Wifi,
  ArrowUpRight,
  Target
} from 'lucide-react'
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import Sidebar from "../components/components/Sidebar"
import ProfileButton from '../components/components/profile'

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
)

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTransactionType, setSelectedTransactionType] = useState("all")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user)
        try {
          const data = await getUserData(user.uid)
          setUserData(data)
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        navigate("/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await auth.signOut()
      navigate("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getCardBackground = (cardType) => {
    const types = {
      visa: 'from-[#1A1F71] to-[#4B1F71]',
      mastercard: 'from-[#EB001B] to-[#F79E1B]',
      rupay: 'from-[#097DC6] to-[#9C27B0]',
      amex: 'from-[#006FCF] to-[#00AEEF]',
      discover: 'from-[#FF6000] to-[#FFA500]'
    }
    return types[cardType?.toLowerCase()] || 'from-gray-700 to-gray-900'
  }

  const calculateMonthlyFinances = () => {
    if (!userData?.expenses || !userData?.accounts) return { 
      income: 0, 
      expenses: 0, 
      recurringIncome: 0 
    }

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    // Calculate recurring income from accounts
    const recurringIncome = userData.accounts.reduce((sum, account) => {
      return sum + (account.isRecurringIncome ? account.recurringAmount : 0)
    }, 0)

    const monthlyTransactions = userData.expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear
    })

    // Sum all transactions for expenses (positive amounts are expenses in your structure)
    const expenses = monthlyTransactions
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    return { income: recurringIncome, expenses, recurringIncome }
  }

  const prepareExpenseData = () => {
    if (!userData?.expenses) return null

    const categories = {}
    userData.expenses.forEach(expense => {
      categories[expense.category] = (categories[expense.category] || 0) + expense.amount
    })

    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0)
    const percentages = Object.entries(categories).map(([category, amount]) => ({
      category,
      percentage: ((amount / total) * 100).toFixed(1)
    }))

    return {
      labels: percentages.map(item => item.category),
      datasets: [{
        data: percentages.map(item => item.percentage),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
          '#FF9F40', '#7CFC00', '#FF69B4'
        ]
      }]
    }
  }

  const prepareIncomeVsExpenseData = () => {
    if (!userData?.expenses) return null

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const currentMonth = new Date().getMonth()
    const startMonth = currentMonth - 5
    
    const monthlyData = Array(6).fill(0).map((_, index) => {
      const month = (startMonth + index + 12) % 12
      const year = new Date().getFullYear() - (month > currentMonth ? 1 : 0)
      
      const monthTransactions = userData.expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === month && 
               expenseDate.getFullYear() === year
      })

      const recurringIncome = userData.accounts.reduce((sum, account) => {
        return sum + (account.isRecurringIncome ? account.recurringAmount : 0)
      }, 0)

      const expenses = monthTransactions
        .reduce((sum, t) => sum + t.amount, 0)

      return { month: monthLabels[month], income: recurringIncome, expenses }
    })

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
    }
  }

  const getSavingsProgress = () => {
    if (!userData?.userDetails?.savingsGoal) return {
      current: 0,
      goal: 10000,
      percentage: 0
    }
    
    const monthlyGoal = userData.userDetails.savingsGoal
    const totalBalance = userData.userDetails.totalBalance || 0
    const progressPercentage = Math.min((totalBalance / monthlyGoal) * 100, 100)
    
    return {
      current: totalBalance,
      goal: monthlyGoal,
      percentage: progressPercentage
    }
  }

  const getFilteredTransactions = () => {
    if (!userData?.expenses) return []
    
    return userData.expenses
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter(transaction => {
        if (selectedTransactionType === "all") return true
        if (selectedTransactionType === "income") return transaction.paymentType === "credit"
        if (selectedTransactionType === "expense") return transaction.paymentType === "debit"
        return true
      })
      .map(transaction => ({
        ...transaction,
        displayAmount: transaction.paymentType === "debit"
          ? `-${formatCurrency(transaction.amount)}` 
          : `+${formatCurrency(transaction.amount)}`
      }))
      .slice(0, 5)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  const { income, expenses, recurringIncome } = calculateMonthlyFinances()
  const savingsProgress = getSavingsProgress()
  const expenseData = prepareExpenseData()
  const incomeVsExpenseData = prepareIncomeVsExpenseData()

  return (
    <div className="min-h-screen bg-gray-100">
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
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />

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
                <div className="text-2xl font-bold">{formatCurrency(userData?.userDetails?.totalBalance || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(income)}</div>
                {recurringIncome > 0 && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    Passive Income: {formatCurrency(recurringIncome)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(expenses)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Savings Goal</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(savingsProgress.current)}</div>
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{savingsProgress.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{width: `${savingsProgress.percentage}%`}}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Goal: {formatCurrency(savingsProgress.goal)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

{/* Financial Accounts */}
<div className="space-y-6">
  {/* Bank Accounts */}
  {userData?.accounts?.filter(account => account.type !== "Credit").length > 0 && (
    <div>
      <h3 className="text-lg font-semibold mb-4">Bank Accounts</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userData.accounts
          .filter(account => account.type !== "Credit")
          .map((account, index) => (
            <Card
              key={index}
              className="bg-gradient-to-br from-blue-50 to-white"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {account.name}
                  </CardTitle>
                  <CardDescription>{account.type}</CardDescription>
                </div>
                <Wallet className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(account.balance)}
                </div>
                {account.isRecurringIncome && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    Monthly Income: {formatCurrency(account.recurringAmount)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )}

  {/* Credit Cards */}
  {userData?.accounts?.filter(account => account.type === "Credit").length > 0 && (
    <div>
      <h3 className="text-lg font-semibold mb-4">Credit Cards</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userData.accounts
          .filter(account => account.type === "Credit")
          .map((account, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className={`h-48 p-6 flex flex-col justify-between bg-gradient-to-br ${getCardBackground(
                    account.cardType
                  )}`}
                >
                  <div className="flex justify-between items-start">
                    <Wifi className="h-8 w-8 text-white opacity-75" />
                    <div className="text-white text-right">
                      <p className="font-bold">{account.name}</p>
                      <p className="text-sm opacity-75">
                        Valid thru: {account.expiryDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-white">
                    <div className="mb-4">
                      <span className="text-xl tracking-widest">
                        •••• •••• ••••{" "}
                        {account.cardNumber?.slice(-4) || "****"}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs opacity-75">Available Credit</p>
                        <p className="font-bold">
                          {formatCurrency(
                            account.creditAmount - Math.abs(account.balance)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs opacity-75">Total Credit</p>
                        <p className="font-bold">
                          {formatCurrency(account.creditAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">Credit Utilization</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${
                            (Math.abs(account.balance) /
                              account.creditAmount) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Current Balance:{" "}
                    {formatCurrency(Math.abs(account.balance))}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )}
</div>


          {/* Charts */}
          {incomeVsExpenseData && expenseData && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <Bar 
                    data={incomeVsExpenseData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: { stacked: false },
                        y: { stacked: false, beginAtZero: true }
                      }
                    }} 
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <Doughnut 
                    data={expenseData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Select 
                value={selectedTransactionType}
                onValueChange={setSelectedTransactionType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredTransactions().map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell 
                        className={transaction.paymentType === "credit" ? 'text-green-600' : 'text-red-600'}
                      >
                        {transaction.displayAmount}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Dashboard