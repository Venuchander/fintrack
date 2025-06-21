import { Navigate } from "react-router-dom";
import { auth } from "../lib/Firebase";
import { useEffect, useState } from "react";

const AuthRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AuthRoute;