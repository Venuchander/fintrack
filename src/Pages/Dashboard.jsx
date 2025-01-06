import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { auth } from "./lib/firebase"
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
  Menu, 
  Bell, 
  ChevronDown, 
  Search, 
  DollarSign, 
  PieChart, 
  Table, 
  MessageSquare, 
  Brain, 
  LogOut, 
  Wallet, 
  TrendingUp, 
  CreditCard 
} from 'lucide-react'
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

function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user)
      } else {
        navigate("/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [navigate])

  const navigationItems = [
    { name: "Dashboard", icon: PieChart, path: "/dashboard" },
    { name: "Income", icon: Wallet, path: "/income" },
    { name: "Expenses", icon: DollarSign, path: "/expense" },
    { name: "Chatbot", icon: MessageSquare, path: "/chatbot" },
    { name: "AI Insights", icon: Brain, path: "/insights" },
  ]

  const handleLogout = async () => {
    try {
      await auth.signOut()
      navigate("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const expenseData = {
    labels: ['Housing', 'Transportation', 'Food', 'Utilities', 'Insurance', 'Healthcare', 'Savings', 'Personal'],
    datasets: [
      {
        data: [35, 15, 15, 10, 5, 5, 10, 5],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#7CFC00', '#FF69B4'
        ],
        hoverBackgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#7CFC00', '#FF69B4'
        ]
      }
    ]
  }

  const incomeVsExpenseData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Income',
        data: [4500, 4200, 4800, 5000, 4700, 5200],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Expense',
        data: [3500, 3700, 3600, 3800, 3500, 3900],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  }

  const savingsGoalData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Actual Savings',
        data: [500, 1000, 1500, 2200, 2800, 3500],
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
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  }

  const barChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white shadow-md">
        <div className="flex items-center justify-center h-20 border-b">
          <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate("/dashboard")}>
            FinTrack
          </h1>
        </div>
        <nav className="flex-grow">
          {navigationItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`w-full justify-start text-left py-3 px-6 ${
                location.pathname === item.path
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              } transition-colors duration-200`}
              onClick={() => navigate(item.path)}
            >
              {React.createElement(item.icon, { className: "mr-2 h-5 w-5" })}
              {item.name}
            </Button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="md:hidden mr-2">
                  <Menu className="h-6 w-6" />
                </Button>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {navigationItems.find(item => item.path === location.pathname)?.name || "Dashboard"}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center">
                  <Button variant="ghost" className="inline-flex items-center">
                    {user?.providerData[0]?.providerId === "google.com" ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user?.photoURL || "/placeholder.svg?height=32&width=32"}
                        alt={user?.displayName || "User"}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-sm">
                          {user?.email?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {user?.displayName || user?.email || "User"}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
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
                { title: "Total Balance", amount: "$12,750", change: "+2.5%", trend: "up", icon: Wallet },
                { title: "Monthly Income", amount: "$5,240", change: "+3.2%", trend: "up", icon: TrendingUp },
                { title: "Monthly Expenses", amount: "$3,890", change: "-1.5%", trend: "down", icon: CreditCard },
                { title: "Savings Goal", amount: "$15,000", progress: "65%", icon: PieChart },
              ].map((item, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    {React.createElement(item.icon, { className: "h-4 w-4 text-muted-foreground" })}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{item.amount}</div>
                    {item.change ? (
                      <p className={`text-xs ${item.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                        {item.change} from last month
                      </p>
                    ) : (
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{width: item.progress}}></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <Bar data={incomeVsExpenseData} options={barChartOptions} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <Doughnut data={expenseData} options={chartOptions} />
                </CardContent>
              </Card>
            </div>

            {/* Savings Goal Chart */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Savings Goal Progress</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Line data={savingsGoalData} options={chartOptions} />
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="mt-8">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Recent Transactions</CardTitle>
                <Select defaultValue="all">
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
                    {[
                      { name: "Salary Deposit", category: "Income", amount: "+$3,500.00", date: "Jul 1, 2025" },
                      { name: "Rent Payment", category: "Housing", amount: "-$1,200.00", date: "Jul 1, 2025" },
                      { name: "Grocery Shopping", category: "Food", amount: "-$85.50", date: "Jun 30, 2025" },
                      { name: "Freelance Work", category: "Income", amount: "+$750.00", date: "Jun 29, 2025" },
                      { name: "Electric Bill", category: "Utilities", amount: "-$95.20", date: "Jun 28, 2025" },
                    ].map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{transaction.name}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell className={transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount}
                        </TableCell>
                        <TableCell>{transaction.date}</TableCell>
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