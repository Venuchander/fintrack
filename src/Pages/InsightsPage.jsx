import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { auth } from "./lib/firebase";
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ProfileButton from '../components/components/profile';
import Sidebar from '../components/components/Sidebar';

const Insights = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const spendingData = [
    { month: 'Jan', spending: 2400, savings: 1000 },
    { month: 'Feb', spending: 1398, savings: 1200 },
    { month: 'Mar', spending: 9800, savings: 800 },
    { month: 'Apr', spending: 3908, savings: 1400 },
    { month: 'May', spending: 4800, savings: 1500 },
    { month: 'Jun', spending: 3800, savings: 1700 },
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUser(user);
      else navigate("/login");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="text-xl font-semibold">Loading...</div>
    </div>
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-2xl font-semibold text-gray-900">Financial Insights</h2>
              <ProfileButton
                user={user}
                onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onLogout={() => auth.signOut()}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-7xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Financial Health Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-green-100 rounded-lg">
                    <h3 className="font-semibold text-lg">Total Savings</h3>
                    <p className="text-2xl font-bold">$7,600</p>
                  </div>
                  <div className="p-4 bg-blue-100 rounded-lg">
                    <h3 className="font-semibold text-lg">Monthly Average</h3>
                    <p className="text-2xl font-bold">$1,267</p>
                  </div>
                  <div className="p-4 bg-purple-100 rounded-lg">
                    <h3 className="font-semibold text-lg">Goal Progress</h3>
                    <p className="text-2xl font-bold">76%</p>
                  </div>
                </div>
                
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spendingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="spending" stroke="#8884d8" />
                      <Line type="monotone" dataKey="savings" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">AI Recommendations</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm">Based on your spending patterns:</p>
                    <ul className="list-disc list-inside mt-2 space-y-2">
                      <li>Consider reducing entertainment expenses by 15%</li>
                      <li>Your savings rate is above average - great job!</li>
                      <li>Look into high-yield savings accounts for better returns</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Insights;