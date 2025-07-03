// Sidebar.jsx
import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { PieChart, IndianRupee, MessageSquare, Brain, LogOut, Wallet, Settings, Bot } from 'lucide-react'
import { Button } from "../ui/button"
import { auth } from "../../Pages/lib/firebase"
import { useTranslation } from "react-i18next";

const Sidebar = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation();

  const navigationItems = [
    { name: t("sidebar.dashboard"), icon: PieChart, path: "/dashboard" },
    { name: t("sidebar.income"), icon: Wallet, path: "/income" },
    { name: t("sidebar.expenses"), icon: IndianRupee, path: "/expense" },
    { name: t("sidebar.chatbot"), icon: MessageSquare, path: "/chatbot" },
    { name: t("sidebar.insights"), icon: Bot, path: "/insights" },
    { name: t("sidebar.settings"), icon: Settings, path: "/settings" }
  ];


  const handleNavigation = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <aside
      className={`fixed inset-y-0 right-0 transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 ease-in-out flex flex-col w-64 bg-white dark:bg-[#0f172a] shadow-md z-30`}
    >
      <div className="flex items-center justify-center h-20 border-b dark:border-gray-700">
        <h1
          className="text-2xl font-bold text-blue-600 dark:text-blue-400 cursor-pointer"
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
            className={`w-full justify-start text-left py-3 px-6 transition-colors duration-200
              ${
                location.pathname === item.path
                  ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            onClick={() => handleNavigation(item.path)}
          >
            {React.createElement(item.icon, { className: "mr-2 h-5 w-5" })}
            {item.name}
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t dark:border-gray-700">
        <Button
          variant="outline"
          className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-300"
          onClick={async () => {
            try {
              await auth.signOut()
              navigate("/login")
            } catch (error) {
              console.error("Error signing out:", error)
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> {t('common.logout')}
        </Button>
      </div>
    </aside>
  )
}

export default Sidebar
