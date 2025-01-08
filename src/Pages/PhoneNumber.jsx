import React, { useState } from "react";
import { auth } from "./lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/components/ui/button";
import { Input } from "../components/components/ui/input";
import { createOrUpdateUser } from "./lib/userService";

const PhoneNumberPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(number);
  };

  const handleSaveUserDetails = async () => {
    const formattedPhoneNumber = phoneNumber.startsWith("+91")
      ? phoneNumber
      : `+91${phoneNumber}`;

    if (!validatePhoneNumber(formattedPhoneNumber)) {
      setError("Please enter a valid Indian phone number");
      return;
    }

    if (!savingsGoal || isNaN(savingsGoal) || savingsGoal <= 0) {
      setError("Please enter a valid savings goal amount");
      return;
    }

    const user = auth.currentUser;

    if (user) {
      try {
        await createOrUpdateUser(user.uid, {
          phoneNumber: formattedPhoneNumber,
          savingsGoal: Number(savingsGoal),
          onboardingCompleted: true
        });
        navigate("/dashboard");
      } catch (error) {
        setError(error.message);
      }
    } else {
      setError("User is not authenticated.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50 p-4">
      <div className="space-y-6 w-full max-w-md">
        <div className="space-y-2">
          <div className="flex items-center mb-8">
            <div className="text-indigo-600 font-bold text-xl">Fintrack</div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to complete the setup:
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number*</label>
            <Input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-11"
              placeholder="Enter your phone number"
            />
            <p className="text-xs text-gray-500">Format: +91XXXXXXXXXX</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Monthly Savings Goal (₹)*</label>
            <Input
              type="number"
              required
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
              className="h-11"
              placeholder="Enter your monthly savings goal"
              min="0"
            />
          </div>

          <Button
            type="button"
            onClick={handleSaveUserDetails}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700"
          >
            Complete Setup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberPage;