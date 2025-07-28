import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import {
  auth
} from "./lib/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Eye, EyeOff } from 'lucide-react';
import { createOrUpdateUser } from "./lib/userService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOffline = () => {
      toast.error("You're offline. Please check your Internet Connection.", {
        toastId: "offline-toast",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      });
    };

    const handleOnline = () => {
      toast.dismiss("offline-toast");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location]);

  const handlePasswordChange = (value) => {
    setPassword(value);

    setPasswordFeedback({
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /\d/.test(value),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
    });
  };

  const allPasswordCriteriaMet = Object.values(passwordFeedback).every(Boolean);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const canSubmit = email && allPasswordCriteriaMet && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!allPasswordCriteriaMet) {
      setError("Password does not meet all strength requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await createOrUpdateUser(user.uid, {
        email: email,
        authProvider: "email",
        isEmailVerified: user.emailVerified,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        status: 'active',
        onboardingCompleted: false,
        createdAt: new Date().toISOString()
      });

      navigate("/phone-number");
    } catch (error) {
      console.error("Error during signup:", error.message);
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please login instead.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(error.message);
      }
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await createOrUpdateUser(user.uid, {
        email: user.email,
        authProvider: "google",
        isEmailVerified: user.emailVerified,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        status: 'active'
      });

      navigate("/phone-number");
    } catch (error) {
      console.error("Google SignUp Error:", error);
      setError(error.code === 'auth/popup-closed-by-user'
        ? "Sign up cancelled. Please try again."
        : error.message);
    }
  };

  return (
    <div>
      <div className="min-h-screen flex justify-center items-center bg-slate-50 dark:bg-gray-900 p-4">
        <div className="space-y-6 w-full max-w-md">
          <div className="space-y-2">
            <div className="flex items-center mb-8">
              <div className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                Fintrack
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Sign Up
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your details to create your Fintrack account:
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email*
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password*
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="h-11 pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="text-xs mt-1 space-y-1">
                  <div className={passwordFeedback.length ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                    {passwordFeedback.length ? "✔" : "•"} At least 8 characters
                  </div>
                  <div className={passwordFeedback.uppercase ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                    {passwordFeedback.uppercase ? "✔" : "•"} At least 1 uppercase letter
                  </div>
                  <div className={passwordFeedback.lowercase ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                    {passwordFeedback.lowercase ? "✔" : "•"} At least 1 lowercase letter
                  </div>
                  <div className={passwordFeedback.number ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                    {passwordFeedback.number ? "✔" : "•"} At least 1 number
                  </div>
                  <div className={passwordFeedback.specialChar ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                    {passwordFeedback.specialChar ? "✔" : "•"} At least 1 special character
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password*
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className={`text-xs mt-1 ${passwordsMatch ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                    {passwordsMatch ? "✔ Passwords match" : "✘ Passwords do not match"}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-5 transition-colors ${
                canSubmit 
                  ? "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white" 
                  : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400"
              }`}
            >
              Sign Up
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full h-11 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            <span>Sign up with Google</span>
          </Button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have a Fintrack Account?{" "}
            <a href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium">
              Log In
            </a>
          </p>
        </div>
      </div>

      <ToastContainer 
        position="top-center"
        theme="auto"
      />
    </div>
  );
};

export default SignupPage;