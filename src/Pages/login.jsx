import  { useState, useEffect } from "react";
import { auth, db } from "./lib/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  query,
  collection,
  where,
  getDocs,
  doc,
  getDoc
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

  //✨ Toast network status
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user exists in Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setCurrentUser(user);
          } else {
            await signOut(auth);
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Error checking user:", err);
          setError("Error verifying user status");
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        await signOut(auth);
        setError("Account not found. Please sign up first.");
        navigate("/signup");
        return;
      }
  
      navigate("/dashboard");
    } catch (err) {
      console.error("Google Sign In Error:", err);
      setError(err.code === 'auth/popup-closed-by-user' 
        ? "Sign in was cancelled. Please try again."
        : (err.message || "Failed to sign in with Google"));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      let loginEmail = identifier;

      // If identifier doesn't contain @, assume it's a username
      if (!identifier.includes("@")) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", identifier));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Account not found. Please create an account first.");
          setTimeout(() => {
            navigate("/signup", { 
              state: { message: "Please create an account to continue." } 
            });
          }, 2000);
          return;
        }
  
        loginEmail = querySnapshot.docs[0].data().email;
      }

      // Attempt to sign in
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      
      // Verify user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (!userDoc.exists()) {
        await signOut(auth);
        setError("Account not found. Please create an account first.");
        setTimeout(() => {
          navigate("/signup");
        }, 2000);
        return;
      }

      const userData = userDoc.data();
      if (!userData.onboardingCompleted) {
        navigate("/phone-number");
        return;
      }

      // If remember me is checked, persist the auth state
      if (rememberMe) {
        await auth.setPersistence('local');
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError("Account not found. Please create an account first.");
          setTimeout(() => {
            navigate("/signup", { 
              state: { message: "Please create an account to continue." } 
            });
          }, 2000);
          break;
        case 'auth/wrong-password':
          setError("Incorrect password. Please try again.");
          break;
        case 'auth/invalid-email':
          setError("Invalid email format.");
          break;
        case 'auth/too-many-requests':
          setError("Too many failed attempts. Please try again later.");
          break;
        default:
          setError(err.message || "Failed to log in");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error("Logout Error:", err);
      setError("Failed to log out");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="w-full max-w-[400px] p-6">
          <div className="mb-8">
            <div className="flex items-center mb-8">
              <div className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                Fintrack
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {currentUser ? "Already Logged In" : "Login"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentUser 
                ? `Welcome back, ${currentUser.email}` 
                : "Hi, Welcome back 👋"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-950/50 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {currentUser ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You are currently logged in. You can:
                </p>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white"
                >
                  Go to dashboard
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full py-5 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email or Username
                    </label>
                    <Input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@example.com or username"
                      required
                      className="py-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="py-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
                        className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                        Remember Me
                      </label>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white"
                  >
                    Login
                  </Button>
                </form>

                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                      or login with Google
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-center gap-2 py-5 font-normal text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={handleGoogleSignIn}
                >
                  <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="w-4 h-4"
                  />
                  Login with Google
                </Button>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                  Not registered yet?{" "}
                  <Link
                    to="/signup"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
                  >
                    Create an account
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <ToastContainer 
        position="top-center"
        theme="auto"
      />
    </div>
    
  );
};

export default LoginPage;