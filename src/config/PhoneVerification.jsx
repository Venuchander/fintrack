import React, { useState } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/components/ui/button";
import { Input } from "../components/components/ui/input";

const PhoneVerificationPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const db = getFirestore();

  const handleSendVerificationCode = async () => {
    const authInstance = getAuth();
    const appVerifier = new RecaptchaVerifier(authInstance, 'recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });

    try {
      const confirmationResult = await signInWithPhoneNumber(authInstance, phoneNumber, appVerifier);
      setVerificationId(confirmationResult.verificationId);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleVerifyCode = async () => {
    const authInstance = getAuth();
    const credential = await authInstance.signInWithPhoneNumber(verificationId, verificationCode);
    const user = credential.user;

    await updateDoc(doc(db, "users", user.uid), {
      phoneNumber: user.phoneNumber,
    });

    navigate("/home");
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50 p-4">
      <div className="space-y-6 w-full max-w-md">
        <div className="space-y-2">
          <div className="flex items-center mb-8">
            <div className="text-indigo-600 font-bold text-xl">Fintrack</div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Phone Verification</h1>
          <p className="text-sm text-muted-foreground">
            Enter your phone number to receive a verification code:
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
            />
          </div>

          <Button
            type="button"
            onClick={handleSendVerificationCode}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700"
          >
            Send Verification Code
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Code*</label>
            <Input
              type="text"
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="h-11"
            />
          </div>

          <Button
            type="button"
            onClick={handleVerifyCode}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700"
          >
            Verify Code
          </Button>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default PhoneVerificationPage;
