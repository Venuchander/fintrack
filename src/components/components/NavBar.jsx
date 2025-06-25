import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu, X, Sun, Moon, PieChart, IndianRupee, MessageSquare,
  Wallet, Bot, Settings, LogOut
} from "lucide-react";
import { Button } from "../ui/button";
import { auth } from "../../Pages/lib/firebase";
import ProfileButton from "./profile";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const navigationItems = [
    { name: "Dashboard", icon: PieChart, path: "/dashboard" },
    { name: "Income", icon: Wallet, path: "/income" },
    { name: "Expenses", icon: IndianRupee, path: "/expense" },
    { name: "Chatbot", icon: MessageSquare, path: "/chatbot" },
    { name: "AI Insights", icon: Bot, path: "/insights" },
    { name: "Settings", icon: Settings, path: "/settings" }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 shadow-md">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        {/* Logo */}
        <h1
          className="text-xl font-bold text-blue-600 dark:text-blue-400 cursor-pointer"
          onClick={() => handleNavigation("/dashboard")}
        >
          FinTrack
        </h1>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {navigationItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className={`flex items-center text-sm ${
                location.pathname === item.path
                  ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600"
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              {React.createElement(item.icon, { className: "mr-1 h-4 w-4" })}
              {item.name}
            </Button>
          ))}

          <Button variant="ghost" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
            onClick={async () => {
              try {
                await auth.signOut();
                navigate("/login");
              } catch (error) {
                console.error("Logout Error:", error);
              }
            }}
          >
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>

          <ProfileButton
            user={auth.currentUser}
            onMenuToggle={toggleMenu}
            onLogout={() => auth.signOut()}
          />
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <Button variant="ghost" onClick={toggleMenu}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={toggleMenu} />
          <div className="absolute top-14 left-0 w-full bg-white dark:bg-gray-900 z-50 shadow-md px-4 pb-4 flex flex-col gap-2 transition-all duration-300">
            {navigationItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className={`w-full justify-start ${
                  location.pathname === item.path
                    ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600"
                }`}
                onClick={() => handleNavigation(item.path)}
              >
                {React.createElement(item.icon, { className: "mr-2 h-4 w-4" })}
                {item.name}
              </Button>
            ))}

            <Button variant="ghost" onClick={toggleDarkMode}>
              {darkMode ? (
                <span className="flex items-center"><Sun className="h-4 w-4 mr-1" /> Light</span>
              ) : (
                <span className="flex items-center"><Moon className="h-4 w-4 mr-1" /> Dark</span>
              )}
            </Button>

            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
              onClick={async () => {
                try {
                  await auth.signOut();
                  navigate("/login");
                } catch (error) {
                  console.error("Logout Error:", error);
                }
              }}
            >
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>

            <ProfileButton
              user={auth.currentUser}
              onMenuToggle={toggleMenu}
              onLogout={() => auth.signOut()}
            />
          </div>
        </>
      )}
    </nav>
  );
};

export default NavBar;
