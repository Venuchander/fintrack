import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "./index.css"; // Assuming Tailwind CSS is applied here

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
import 'animate.css'     //normal animation on render
import 'aos/dist/aos.css' //on scroll animation
import AOS from 'aos'
AOS.init()      //initialize AOS
// Main component that holds the routes
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} /> {/* Route for LoginPage */}
        <Route path="/signup" element={<SignupPage />} /> {/* Route for SignupPage */}
        <Route path="/phone-number" element={<PhoneNumberPage />} /> {/* Route for PhoneNumberPage */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Route for Dashboard */}
        <Route path="/expense" element={<Expenses />} /> {/* Route for Expense */}
        <Route path="/insights" element={<Insights />} /> {/* Route for Insights */}
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/income" element={<Income />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* Redirect default route to signup */}
        <Route path="/" element={<Navigate to="/signup" />} /> {/* Redirect to SignupPage if no path is specified */}
      </Routes>
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
