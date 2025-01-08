import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { 
  doc, 
  setDoc,
  getDoc
} from "firebase/firestore";
import { auth, db } from "./lib/firebase";  // Import from your firebase.js file
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/components/ui/button";
import { Input } from "../components/components/ui/input";
import { Eye, EyeOff } from 'lucide-react';
import { createOrUpdateUser } from "./lib/userService";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show message if redirected from login
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location]);

  const validatePassword = (pass) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    if (pass.length < minLength) return "Password must be at least 8 characters long";
    if (!hasUpperCase) return "Password must contain at least one uppercase letter";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter";
    if (!hasNumbers) return "Password must contain at least one number";
    if (!hasSpecialChar) return "Password must contain at least one special character";
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
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
    <div className="min-h-screen flex justify-center items-center bg-slate-50 p-4">
      <div className="space-y-6 w-full max-w-md">
        <div className="space-y-2">
          <div className="flex items-center mb-8">
            <div className="text-indigo-600 font-bold text-xl">Fintrack</div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign Up</h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to create your Fintrack account:
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email*</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Password*</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password*</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700"
          >
            Sign Up
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-50 px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full h-11 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Sign up with Google</span>
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have a Fintrack Account?{" "}
          <a href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Log In
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;