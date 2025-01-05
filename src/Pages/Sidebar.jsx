import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { PieChart, DollarSign, MessageSquare, Brain, LogOut } from 'lucide-react'
import { Button } from "../components/components/ui/button"

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Navigation items with their routes
  const navigationItems = [
    { name: "Dashboard", icon: PieChart, path: "/dashboard" },
    { name: "Expenses", icon: DollarSign, path: "/expense" },
    { name: "Chatbot", icon: MessageSquare, path: "/chatbot" },
    { name: "AI Insights", icon: Brain, path: "/insights" },
  ]

  // Handle logout
  const handleLogout = () => {
    // Add your logout logic here
    navigate("/login")
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white shadow-md">
      <div className="flex items-center justify-center h-20 border-b">
        <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate("/")}>FinTrack</h1>
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
  )
}

export default Sidebar