import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/components/ui/button";
import { Input } from "../components/components/ui/input";
import { Eye, EyeOff } from 'lucide-react';

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Check if email already exists
      const emailQuery = query(collection(db, "users"), where("email", "==", email));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        setError("Email already exists. Please login instead.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        authProvider: "email",
        createdAt: new Date().toISOString()
      });

      navigate("/phone-verification");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists
      const userQuery = query(collection(db, "users"), where("email", "==", user.email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        setError("Account already exists. Please login instead.");
        navigate("/login");
        return;
      }

      // Store user information
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        photoURL: user.photoURL,
        authProvider: "google",
        createdAt: new Date().toISOString()
      });

      navigate("/phone-verification");
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign up cancelled. Please try again.");
      } else {
        setError(error.message);
      }
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
          Already have an Fintrack Account?{" "}
          <a href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Log In
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
