import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { auth } from "./lib/firebase";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ProfileButton from '../components/components/profile';
import Sidebar from '../components/components/Sidebar';
import { Loader2 } from 'lucide-react';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEN_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const db = getFirestore();

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const formatInsight = (insight) => {
  return insight
    // Remove asterisks around words while preserving the content
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove double asterisks around words
    .replace(/\*([^*]+)\*/g, '$1')     // Remove single asterisks around words
    // Remove bullet points at start
    .replace(/^\* /g, '')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    // Clean up spacing around colons
    .split(':')
    .map(part => part.trim())
    .join(': ');
};


// Generate prompts for different timeframes
const generatePrompts = (userData) => {
  // Helper function to format currency in INR
  const formatINR = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
  };

  // Helper function to calculate date ranges
  const getDateRangeExpenses = (days) => {
    return userData?.expenses?.filter(exp => 
      new Date(exp.date) >= new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );
  };

  const dailyPrompt = `
    Analyze this user's daily financial activity (all amounts in INR):
    - Total Balance: ${formatINR(userData?.totalBalance)}
    - Daily Transactions: ${JSON.stringify(userData?.expenses?.filter(exp =>
      new Date(exp.date).toDateString() === new Date().toDateString()
    ))}
    - Daily Income: ${formatINR(userData?.accounts?.reduce((sum, acc) =>
      sum + (acc.isRecurringIncome ? acc.recurringAmount / 30 : 0), 0))}
   
    Provide 3 specific, actionable daily insights focusing on:
    1. Today's spending compared to daily average
    2. Specific recommendations for tomorrow
    3. Progress towards daily savings goals in INR
   
    Format as bullet points without any introductory text.`;

  const weeklyPrompt = `
    Analyze this user's weekly financial activity (all amounts in INR):
    - Weekly Expenses: ${JSON.stringify(getDateRangeExpenses(7))}
    - Weekly Income: ${formatINR(userData?.accounts?.reduce((sum, acc) =>
      sum + (acc.isRecurringIncome ? acc.recurringAmount / 4 : 0), 0))}
    - Savings Goal Progress: ${formatINR(userData?.savingsGoal)}
   
    Provide 3 specific, actionable weekly insights focusing on:
    1. Highest expense category analysis
    2. Week-over-week comparison
    3. Areas for improvement
   
    Format as bullet points without any introductory text.`;

  const monthlyPrompt = `
    Analyze this user's monthly financial activity (all amounts in INR):
    - Monthly Income: ${formatINR(userData?.accounts?.reduce((sum, acc) =>
      sum + (acc.isRecurringIncome ? acc.recurringAmount : 0), 0))}
    - Monthly Expenses: ${JSON.stringify(getDateRangeExpenses(30))}
    - Monthly Savings: ${formatINR(userData?.monthlySavings)}
   
    Provide 3 specific, actionable monthly insights focusing on:
    1. Savings progress
    2. Recurring expenses analysis
    3. Recommendations for improvement
   
    Format as bullet points without any introductory text.`;

  const yearlyPrompt = `
    Analyze this user's yearly financial trajectory (all amounts in INR):
    - Annual Income: ${formatINR(userData?.accounts?.reduce((sum, acc) =>
      sum + (acc.isRecurringIncome ? acc.recurringAmount * 12 : 0), 0))}
    - Savings Goal: ${formatINR(userData?.savingsGoal)}
    - Investment Portfolio: ${userData?.investments || 'None'}
   
    Provide 3 specific, actionable yearly insights focusing on:
    1. Progress towards annual goals
    2. Investment recommendations
    3. Long-term financial planning
   
    Format as bullet points without any introductory text.`;

  return { dailyPrompt, weeklyPrompt, monthlyPrompt, yearlyPrompt };
};

const Insights = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [insights, setInsights] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Fetch user data and generate insights
  useEffect(() => {
    const fetchDataAndGenerateInsights = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (!user) {
            navigate("/login");
            return;
          }

          setUser(user);
          
          // Fetch user data
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserData(userData);

            // Generate insights using Gemini
            const prompts = generatePrompts(userData);
            const [dailyResponse, weeklyResponse, monthlyResponse, yearlyResponse] = await Promise.all([
              model.generateContent(prompts.dailyPrompt),
              model.generateContent(prompts.weeklyPrompt),
              model.generateContent(prompts.monthlyPrompt),
              model.generateContent(prompts.yearlyPrompt)
            ]);

            setInsights({
              daily: dailyResponse.response.text()
                .split('\n')
                .filter(item => item.trim())
                .map(formatInsight),
              weekly: weeklyResponse.response.text()
                .split('\n')
                .filter(item => item.trim())
                .map(formatInsight),
              monthly: monthlyResponse.response.text()
                .split('\n')
                .filter(item => item.trim())
                .map(formatInsight),
              yearly: yearlyResponse.response.text()
                .split('\n')
                .filter(item => item.trim())
                .map(formatInsight)
            });
          }
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error generating insights:', error);
        setIsLoading(false);
      }
    };

    fetchDataAndGenerateInsights();
  }, [navigate]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <div className="ml-2 text-xl font-semibold">Generating insights...</div>
      </div>
    );
  }

  const renderInsight = (insight, index) => {
    // Split insight into title and content if it contains a colon
    const [title, content] = insight.includes(': ') 
      ? insight.split(': ')
      : [null, insight];

    return (
      <li key={index} className="flex items-start">
        <span className="flex-shrink-0 w-4 h-4 mt-1 mr-2 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
        </span>
        <span className="text-gray-700">
          {title ? (
            <>
              <span className="font-semibold">{title}: </span>
              {content}
            </>
          ) : (
            content
          )}
        </span>
      </li>
    );
  };

  return (
    <div>
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
                <h2 className="text-2xl font-semibold text-gray-900">AI Financial Insights</h2>
                <ProfileButton
                  user={user}
                  onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                  onLogout={() => auth.signOut()}
                />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">
                Personalized Financial Recommendations
              </h2>
              <div className="space-y-6">
                {/* Daily Insights */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-lg mb-4 text-blue-600">Daily Insights</h3>
                  <ul className="space-y-3">
                    {insights.daily.map((insight, index) => renderInsight(insight, `daily-${index}`))}
                  </ul>
                </div>

                {/* Weekly Analysis */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-lg mb-4 text-green-600">Weekly Analysis</h3>
                  <ul className="space-y-3">
                    {insights.weekly.map((insight, index) => renderInsight(insight, `weekly-${index}`))}
                  </ul>
                </div>

                {/* Monthly Overview */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-lg mb-4 text-purple-600">Monthly Overview</h3>
                  <ul className="space-y-3">
                    {insights.monthly.map((insight, index) => renderInsight(insight, `monthly-${index}`))}
                  </ul>
                </div>

                {/* Yearly Projections */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-lg mb-4 text-orange-600">Yearly Projections</h3>
                  <ul className="space-y-3">
                    {insights.yearly.map((insight, index) => renderInsight(insight, `yearly-${index}`))}
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <ToastContainer position="top-center" />
  </div>
  );
};

export default Insights;