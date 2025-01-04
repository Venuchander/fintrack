import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Added Navigate for redirect
import './index.css'; // Assuming Tailwind CSS is applied here

// Import your pages
import LoginPage from './config/login'; // The login page component
import SignupPage from './config/signup'; // The signup page component
import PhoneVerificationPage from './config/PhoneNumber'; // New page for phone verification

// Main component that holds the routes
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} /> {/* Route for LoginPage */}
        <Route path="/signup" element={<SignupPage />} /> {/* Route for SignupPage */}
        <Route path="/phone-verification" element={<PhoneVerificationPage />} /> {/* New route for PhoneVerificationPage */}

        {/* Redirect default route to signup */}
        <Route path="/" element={<Navigate to="/signup" />} /> {/* Redirect to SignupPage if no path is specified */}
      </Routes>
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
