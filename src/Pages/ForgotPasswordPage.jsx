import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./lib/firebase";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (error) {
      console.error("Reset Error:", error);
      toast.error("Failed to send reset email. Please check your email address.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="py-5"
          />
          <Button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700">
            Send Reset Link
          </Button>
        </form>
        <ToastContainer position="top-center" />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
