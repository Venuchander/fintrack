import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth } from "./lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/components/ui/button";
import { Input } from "../components/components/ui/input";

const PhoneNumberPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const db = getFirestore();

  const handleSavePhoneNumber = async () => {
    const formattedPhoneNumber = phoneNumber.startsWith("+91")
      ? phoneNumber
      : `+91${phoneNumber}`;

    const user = auth.currentUser;

    if (user) {
      try {
        // Save phone number to Firestore under the user document
        await setDoc(doc(db, "users", user.uid), {
          phoneNumber: formattedPhoneNumber,
        });

        // Redirect to home after saving phone number
        navigate("/home");
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
          <h1 className="text-2xl font-semibold tracking-tight">Phone Number</h1>
          <p className="text-sm text-muted-foreground">
            Enter your phone number to save it:
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
              placeholder="Enter phone number"
            />
          </div>

          <Button
            type="button"
            onClick={handleSavePhoneNumber}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700"
          >
            Save Phone Number
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberPage;
