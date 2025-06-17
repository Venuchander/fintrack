// Sidebar.jsx
import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { PieChart, IndianRupee, MessageSquare, Brain, LogOut, Wallet, Settings, Bot } from 'lucide-react'
import { Button } from "../ui/button"
import { auth } from "../../Pages/lib/firebase"

const Sidebar = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const navigationItems = [
    { name: "Dashboard", icon: PieChart, path: "/dashboard" },
    { name: "Income", icon: Wallet, path: "/income" },
    { name: "Expenses", icon: IndianRupee, path: "/expense" },
    { name: "Chatbot", icon: MessageSquare, path: "/chatbot" },
    { name: "AI Insights", icon: Bot, path: "/insights" },
    {name: "Settings", icon: Settings, path: "/settings"}
  ]

  const handleNavigation = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <aside 
      className={`fixed inset-y-0 right-0 transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 ease-in-out flex flex-col w-64 bg-white shadow-md z-30`}
    >
      <div className="flex items-center justify-center h-20 border-b">
        <h1 
          className="text-2xl font-bold text-blue-600 cursor-pointer animate__animated animate__slideInDown" 
          onClick={() => handleNavigation("/dashboard")}
        >
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
            } transition-colors duration-200 animate__animated animate__fadeInDown`}
            onClick={() => handleNavigation(item.path)}
          >
            {React.createElement(item.icon, { className: "mr-2 h-5 w-5" })}
            {item.name}
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 animate__animated animate__fadeInDown"
          onClick={async () => {
            try {
              await auth.signOut()
              navigate("/login")
            } catch (error) {
              console.error("Error signing out:", error)
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4 animate__animated animate__fadeInUp" /> Logout
        </Button>
      </div>
    </aside>
  )
}

export default Sidebar