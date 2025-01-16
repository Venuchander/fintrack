import React, { useState } from "react";
import { auth } from "./lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { createOrUpdateUser } from "./lib/userService";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";

const PhoneNumberPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const navigate = useNavigate();

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(number);
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 10) {
      setPhoneNumber(value);
      setError("");
    } else {
      setIsShaking(true);
      setError("Phone number cannot exceed 10 digits");
      setTimeout(() => setIsShaking(false), 650);
    }
  };

  const handleSaveUserDetails = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit Indian phone number");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 650);
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
          phoneNumber: `+91${phoneNumber}`,
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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number*</label>
            <div className="flex">
              <div className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-md">
                <span className="text-gray-500 text-sm">+91</span>
              </div>
              <Input
                type="tel"
                required
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                className={`h-11 rounded-l-none ${isShaking ? 'animate-shake' : ''}`}
                placeholder="Enter 10-digit number"
                style={{
                  "@keyframes shake": {
                    "0%, 100%": { transform: "translateX(0)" },
                    "25%": { transform: "translateX(8px)" },
                    "75%": { transform: "translateX(-8px)" },
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Monthly Savings Goal (₹)*</label>
            <Input
              type="number"
              required
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
              className="h-11 no-spinner"
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

      <style jsx>{`
        /* Keyframes for shake animation */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }

        .animate-shake {
          animation: shake 0.65s cubic-bezier(.36,.07,.19,.97) both;
        }

        /* CSS to remove spinner buttons */
        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .no-spinner {
          -moz-appearance: textfield; /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default PhoneNumberPage;