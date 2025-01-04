// config/phone-verification.js

import React, { useState } from 'react';

const PhoneVerificationPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleVerification = () => {
    if (!phoneNumber || !otp) {
      setError('Please enter both phone number and OTP.');
    } else {
      // Handle OTP verification logic here
      setError(''); // Reset error if valid
      // Perform the actual OTP verification logic (e.g., API call)
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50 p-4">
      <div className="space-y-6 w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">Phone Verification</h1>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="h-11 p-2 border border-gray-300 rounded"
            placeholder="Enter your phone number"
          />
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="h-11 p-2 border border-gray-300 rounded"
            placeholder="Enter OTP"
          />
          <button
            onClick={handleVerification}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationPage;
