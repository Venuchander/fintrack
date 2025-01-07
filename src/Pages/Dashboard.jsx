import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
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
import { Menu, ChevronDown, DollarSign, PieChart, MessageSquare, Brain, LogOut, Wallet, TrendingUp, CreditCard, Wifi } from 'lucide-react'
import { Button } from "../components/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/components/ui/card"
import { Input } from "../components/components/ui/input"
import {
  Table as TableUI,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/components/ui/select"

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

import ProfileButton from './profile'
import Sidebar from './Sidebar'

function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedTransactionType, setSelectedTransactionType] = useState("all")

  // Fetch user data when auth state changes
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

  const getCardBackground = (cardType) => {
    const types = {
      visa: 'from-purple-500 to-pink-500',
      mastercard: 'from-orange-500 to-red-500',
      rupay: 'from-indigo-500 to-blue-500',
      amex: 'from-green-400 to-blue-500',
      discover: 'from-yellow-400 to-orange-500'
    }
    return types[cardType?.toLowerCase()] || 'from-gray-500 to-gray-700'
  }

  const getCardBranding = (cardType) => {
    const type = cardType?.toLowerCase()
    switch(type) {
      case 'visa':
        return <span className="text-2xl font-bold italic">VISA</span>
      case 'mastercard':
        return <span className="text-2xl font-bold">MASTERCARD</span>
      case 'rupay':
        return <span className="text-2xl font-bold">RUPAY</span>
      case 'american express':
        return <span className="text-2xl font-bold">AMEX</span>
      case 'discover':
        return <span className="text-2xl font-bold">DISCOVER</span>
      default:
        return <span className="text-2xl font-bold">{cardType?.toUpperCase()}</span>
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Calculate monthly income and expenses
  const calculateMonthlyFinances = () => {
    if (!userData?.expenses) return { income: 0, expenses: 0 }

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyTransactions = userData.expenses.filter(expense => {
      const expenseDate = new Date(expense.createdAt)
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear
    })

    const income = monthlyTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = monthlyTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return { income, expenses }
  }

  // Prepare data for expense breakdown chart
  const prepareExpenseData = () => {
    if (!userData?.expenses) return null

    const categories = {}
    userData.expenses
      .filter(expense => expense.amount < 0)
      .forEach(expense => {
        categories[expense.category] = (categories[expense.category] || 0) + Math.abs(expense.amount)
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

  // Prepare data for income vs expense chart
  const prepareIncomeVsExpenseData = () => {
    if (!userData?.expenses) return null

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const currentMonth = new Date().getMonth()
    const startMonth = currentMonth - 5
    
    const monthlyData = Array(6).fill(0).map((_, index) => {
      const month = (startMonth + index + 12) % 12
      const year = new Date().getFullYear() - (month > currentMonth ? 1 : 0)
      
      const monthTransactions = userData.expenses.filter(expense => {
        const expenseDate = new Date(expense.createdAt)
        return expenseDate.getMonth() === month && 
               expenseDate.getFullYear() === year
      })

      const income = monthTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = monthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      return { month: monthLabels[month], income, expenses }
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

  // Filter transactions based on selected type
  const getFilteredTransactions = () => {
    if (!userData?.expenses) return []
    
    return userData.expenses
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter(transaction => {
        if (selectedTransactionType === "all") return true
        if (selectedTransactionType === "income") return transaction.amount > 0
        if (selectedTransactionType === "expense") return transaction.amount < 0
        return true
      })
      .slice(0, 5) // Show only last 5 transactions
  }

  const { income: monthlyIncome, expenses: monthlyExpenses } = calculateMonthlyFinances()
  const expenseData = prepareExpenseData()
  const incomeVsExpenseData = prepareIncomeVsExpenseData()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {location.pathname.split('/')[1].charAt(0).toUpperCase() + 
                   location.pathname.split('/')[1].slice(1) || "Dashboard"}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <ProfileButton 
                  user={user}
                  onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-7xl mx-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { 
                  title: "Total Balance", 
                  amount: formatCurrency(userData?.totalBalance || 0),
                  icon: Wallet 
                },
                { 
                  title: "Monthly Income", 
                  amount: formatCurrency(monthlyIncome),
                  icon: TrendingUp 
                },
                { 
                  title: "Monthly Expenses", 
                  amount: formatCurrency(monthlyExpenses),
                  icon: CreditCard 
                },
                { 
                  title: "Savings Goal", 
                  amount: formatCurrency(15000), 
                  progress: "65%", 
                  icon: PieChart 
                },
              ].map((item, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    {React.createElement(item.icon, { className: "h-4 w-4 text-muted-foreground" })}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{item.amount}</div>
                    {item.progress && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{width: item.progress}}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Bank Accounts */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {userData?.accounts
                ?.filter(account => account.type === "Bank")
                ?.map((account, index) => (
                <Card key={index} className="bg-blue-50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(account.balance)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Credit Cards */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {userData?.accounts
                ?.filter(account => account.type === "Credit")
                ?.map((card, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`h-48 p-6 flex flex-col justify-between bg-gradient-to-br ${getCardBackground(card.cardType)}`}>
                      <div className="flex justify-between items-start">
                        <Wifi className="h-8 w-8 text-white opacity-75" />
                        <span className="text-white font-bold">{card.name}</span>
                      </div>
                      <div className="text-white">
                        <div className="mb-4">
                          <span className="text-2xl tracking-wider">
                          •••• •••• •••• {card.cardNumber?.slice(-4) || '****'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-xs opacity-75">Expires</p>
                            <p className="font-bold">{card.expiryDate || 'MM/YY'}</p>
                          </div>
                          <div>
                            <p className="text-xs opacity-75">Balance</p>
                            <p className="font-bold">{formatCurrency(card.balance)}</p>
                          </div>
                          {getCardBranding(card.cardType)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            {incomeVsExpenseData && expenseData && (
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
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

            {/* Savings Goal Chart */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Savings Goal Progress</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Line 
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                      {
                        label: 'Actual Savings',
                        data: userData?.savingsProgress || [500, 1000, 1500, 2200, 2800, 3500],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        fill: true
                      },
                      {
                        label: 'Savings Goal',
                        data: [1000, 2000, 3000, 4000, 5000, 6000],
                        borderColor: 'rgba(255, 159, 64, 1)',
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                      }
                    ]
                  }}
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

            {/* Recent Transactions */}
            <Card className="mt-8">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Recent Transactions</CardTitle>
                <Select 
                  value={selectedTransactionType}
                  onValueChange={setSelectedTransactionType}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <TableUI>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
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
                          className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}
                        >
                          {transaction.amount > 0 ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableUI>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard