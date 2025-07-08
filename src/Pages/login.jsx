import React, { useState, useEffect } from "react";
import { auth, db } from "./lib/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  query,
  collection,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOffline = () => {
      toast.error("You're offline. Please check your Internet Connection.", {
        toastId: "offline-toast",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      });
    };
    const handleOnline = () => toast.dismiss("offline-toast");
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setCurrentUser(user);
        else await signOut(auth);
      } else setCurrentUser(null);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        setError("Account not found. Please sign up first.");
        navigate("/signup");
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.code === "auth/popup-closed-by-user"
          ? "Sign in was cancelled. Please try again."
          : err.message || "Failed to sign in with Google"
      );
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      let loginEmail = identifier;
      if (!identifier.includes("@")) {
        const q = query(collection(db, "users"), where("username", "==", identifier));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setError("Account not found. Please create an account first.");
          setTimeout(() => navigate("/signup"), 2000);
          return;
        }
        loginEmail = snapshot.docs[0].data().email;
      }
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        setError("Account not found. Please create an account first.");
        setTimeout(() => navigate("/signup"), 2000);
        return;
      }
      if (!userDoc.data().onboardingCompleted) return navigate("/phone-number");
      if (rememberMe) await auth.setPersistence("local");
      navigate("/dashboard");
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("Account not found.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password.");
          break;
        case "auth/invalid-email":
          setError("Invalid email.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts.");
          break;
        default:
          setError(err.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-3xl p-8 space-y-6 transition-all duration-300">
        <div className="text-indigo-600 font-extrabold text-4xl text-center tracking-wide">Fintrack 🚀</div>
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white">Welcome back 👋</h1>
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">Please sign in to continue</p>

        {error && <div className="p-3 border-l-4 border-red-500 bg-red-100 text-sm text-red-700 rounded-md">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email or Username"
            required
            className="rounded-xl px-4 py-5 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="rounded-xl px-4 py-5 pr-10 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={setRememberMe} />
              <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">Remember Me</label>
            </div>
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">Forgot Password?</Link>
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-semibold py-4 transition-all shadow-md">Sign In</Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-medium text-gray-500 bg-white dark:bg-gray-800 px-2">
            Or login with
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          className="w-full justify-center gap-3 py-4 text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 border-gray-300 dark:border-gray-600 rounded-xl transition-all"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Login with Google
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Not registered yet? <Link to="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">Create an account</Link>
        </p>
      </div>
      <ToastContainer position="top-center" autoClose={3000} theme="light" />
    </div>
  );
};

export default LoginPage;
