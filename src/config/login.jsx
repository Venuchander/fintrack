import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/components/ui/button";
import { Input } from "../components/components/ui/input";
import { Checkbox } from "../components/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";

const db = getFirestore();

const LoginPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if the user is already logged in AND registered
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if the user exists in Firestore
          const q = query(
            collection(db, "users"),
            where("email", "==", user.email)
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            navigate("/home"); // Only redirect if user exists in Firestore
          } else {
            // If user is authenticated but not in Firestore, sign them out
            await auth.signOut();
          }
        } catch (err) {
          console.error("Error checking user registration:", err);
        }
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, [navigate]);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the email exists in the Firestore database
      const q = query(collection(db, "users"), where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // If user doesn't exist in Firestore, sign them out and redirect to signup
        await auth.signOut();
        setError("This email is not registered. Please sign up first.");
        navigate("/signup");
        return;
      }

      // If the email exists, proceed to the home page
      alert(`Welcome, ${user.displayName}!`);
      navigate("/home");
    } catch (err) {
      console.error("Error signing in with Google:", err);
      setError(err.message);
    }
  };

  // Email/Username Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      let email = identifier;

      // If identifier is a username, look up the email
      if (!email.includes("@")) {
        const q = query(
          collection(db, "users"),
          where("username", "==", identifier)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error("Username not found");
        }

        email = querySnapshot.docs[0].data().email;
      }

      // Check if the email exists in Firestore before attempting login
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Email not registered. Please sign up first.");
      }

      // Attempt to sign in
      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in successfully!");
      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-[400px] p-6">
        <div className="mb-8">
          <div className="flex items-center mb-8">
            <div className="text-indigo-600 font-bold text-xl">Fintrack</div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Hi, Welcome back 👋</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com"
                required
                className="py-5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="py-5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                />
                <label htmlFor="remember" className="text-sm text-gray-600">
                  Remember Me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700"
            >
              Login
            </Button>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 px-2 text-gray-500">
                or login with Google
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full justify-center gap-2 py-5 font-normal text-gray-700"
            onClick={handleGoogleSignIn}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-4 h-4"
            />
            Login with Google
          </Button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Not registered yet?{" "}
            <Link
              to="/signup"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;