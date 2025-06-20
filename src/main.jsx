import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
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

const Landing = ({ onFinish }) => {
  const [visible, setVisible] = useState(false);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true), 100); // Trigger entry animation
    const t1 = setTimeout(() => setExit(true), 2200); // Start fade-out
    const t2 = setTimeout(onFinish, 2900); // Wait for fade-out
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [onFinish]);

  return (
    <div className={"fintrack-welcome-bg" + (exit ? " smooth-exit" : "")}>
      <div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative'}}>
        <div className={`fintrack-app-name-large ${visible ? 'visible' : ''}`}>{APP_NAME}</div>
        <div className={`fintrack-tagline-large ${visible ? 'visible' : ''}`}>Effortless finance tracking</div>
      </div>
    </div>
  );
};

const App = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showWelcome) {
      navigate("/signup");
    }
  }, [showWelcome, navigate]);

  return (
    <>
      {showWelcome ? (
        <Landing onFinish={() => setShowWelcome(false)} />
      ) : (
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
      )}
    </>
  );
};

const Root = () => (
  <Router>
    <App />
  </Router>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
