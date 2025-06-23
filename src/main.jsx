import React from "react";
import ReactDOM from "react-dom/client";
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
import FAB from "./components/ui/FAB";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
