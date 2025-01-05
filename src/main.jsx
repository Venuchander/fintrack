import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Added Navigate for redirect
import './index.css'; // Assuming Tailwind CSS is applied here

// Import your pages
import LoginPage from './Pages/login'; // The login page component
import SignupPage from './Pages/signup'; // The signup page component
import PhoneNumberPage from './Pages/PhoneNumber'; // Updated page for phone number

// Main component that holds the routes
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} /> {/* Route for LoginPage */}
        <Route path="/signup" element={<SignupPage />} /> {/* Route for SignupPage */}
        <Route path="/phone-number" element={<PhoneNumberPage />} /> {/* Updated route for PhoneNumberPage */}

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
