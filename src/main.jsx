import React from "react";
import ReactDOM from "react-dom/client";
import './i18n'; 
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "./index.css";
import LoginPage from "./Pages/login";
import SignupPage from "./Pages/signup";
import PhoneNumberPage from "./Pages/PhoneNumber";
import Dashboard from "./Pages/Dashboard";
import Expenses from "./Pages/ExpensePage";
import Insights from "./Pages/InsightsPage";
import Chatbot from "./Pages/ChatbotPage";
import Income from "./Pages/IncomePage";
import SettingsPage from "./Pages/SettingsPage";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage"; // The forget password component
import FAB from "./components/ui/FAB";

import ProtectedRoute from "./components/components/ProtectedRoute";
import AuthRoute from "./components/components/AuthRoute";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* Route for forgetpassword page*/}
        <Route path="/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />
        <Route path="/phone-number" element={<PhoneNumberPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/expense" element={<Expenses />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/income" element={<Income />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/signup" />} />
      </Routes>

      <FAB /> 
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
