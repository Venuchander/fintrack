import React, { useState, useEffect } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

// It's assumed that Firebase is already initialized in your project 
// It's forgetPassword.jsx used to handle the password reset functionality in a React application using Firebase Authentication.
// you can customize the reset email from Firebase console. and add the custom domain in the firebase console to send the email from your custom domain.

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(null);

  const navigate = useNavigate();

  // Initialize countdown to 10 seconds when the email is successfully sent
  useEffect(() => {
    if (countdown === 0) {
      navigate("/login");// after countdown is over, redirect to login page
    }

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000); // Changed back to 1s per tick
      return () => clearTimeout(timer);
    }
  }, [countdown, navigate]);

  // Handle form submission for password reset
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    const auth = getAuth();
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setMessage("✅ Password reset email sent successfully!");
        setCountdown(10);
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-6 py-8 border rounded-xl shadow-lg bg-white">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-indigo-600 mb-2">
          Fintrack
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          <span className="block font-semibold text-gray-800 mb-1">
            Forgot your password?
          </span>
          No worries! Just enter your registered email below and we’ll send you
          a link to reset it.
        </p>
      </div>

      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        Reset Your Password
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />

        <button
          type="submit"
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition duration-300"
        >
          Send Reset Email
        </button>

        {message && (
          <p className="text-green-600 text-sm mt-4">
            {message}
            {countdown !== null && (
              <span className="block text-xs text-gray-500 mt-1">
                Redirecting to login in {countdown} second
                {countdown !== 1 && "s"}...
              </span>
            )}
          </p>
        )}

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Reset your password?{" "}
        <Link
          to="/login"
          className="text-indigo-600 hover:text-indigo-500 font-medium"
        >
          Go to login
        </Link>
      </p>
    </div>
  );
}
