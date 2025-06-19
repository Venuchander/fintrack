import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "./index.css";

// Import your pages
import LoginPage from "./Pages/login"; // The login page component
import SignupPage from "./Pages/signup"; // The signup page component
import PhoneNumberPage from "./Pages/PhoneNumber"; // Updated page for phone number
import Dashboard from "./Pages/Dashboard"; // Import the Dashboard component
import Expenses from "./Pages/ExpensePage"; // Import the Expenses component
import Insights from "./Pages/InsightsPage"; // Import the Insights component
import Chatbot from "./Pages/ChatbotPage"; // Import the Chatbot component
import Income from "./Pages/IncomePage";
import SettingsPage from "./Pages/SettingsPage";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage"; // The forget password component

const APP_NAME = "FINTRACK";

// Landing page with animated intro
const App = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAppName, setShowAppName] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [exitAnim, setExitAnim] = useState(false);

  useEffect(() => {
    if (showWelcome) {
      setShowAppName(false);
      setShowTagline(false);
      setShowButton(false);
      const t1 = setTimeout(() => setShowAppName(true), 100);
      const t2 = setTimeout(() => setShowTagline(true), 800);
      const t3 = setTimeout(() => setShowButton(true), 1500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [showWelcome]);

  const handleGetStarted = () => {
    setExitAnim(true);
    setTimeout(() => {
      setShowWelcome(false);
      setExitAnim(false);
    }, 600); // match the CSS animation duration
  };

  return (
    <>
      {showWelcome ? (
        <div className={`fintrack-welcome-bg${exitAnim ? ' exit' : ''}`}>
          <div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative'}}>
            <div className={`fintrack-app-name${showAppName ? ' visible' : ''}`}>{APP_NAME}</div>
            <div className={`fintrack-tagline${showTagline ? ' visible' : ''}`}>Track your finances effortlessly</div>
            <button
              className={`fintrack-welcome-btn${showButton ? ' visible' : ''}`}
              onClick={handleGetStarted}
              disabled={exitAnim}
            >
              Get Started
            </button>
          </div>
        </div>
      ) : (
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/phone-number" element={<PhoneNumberPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expense" element={<Expenses />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/income" element={<Income />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/signup" />} />
          </Routes>
        </Router>
      )}
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
