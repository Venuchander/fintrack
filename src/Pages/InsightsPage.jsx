import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { auth } from "./lib/firebase";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ProfileButton from '../components/components/profile';
import Sidebar from '../components/components/Sidebar';
import DarkModeToggle from '../components/ui/DarkModeToggle';
import { Loader2 } from 'lucide-react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEN_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const db = getFirestore();

const formatInsight = (insight) => {
  return insight
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^\* /g, '')
    .replace(/\s+/g, ' ')
    .split(':')
    .map(part => part.trim())
    .join(': ');
};

const generatePrompts = (userData) => {
  const formatINR = (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`;
  const getDateRangeExpenses = (days) =>
    userData?.expenses?.filter(exp =>
      new Date(exp.date) >= new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );

  const dailyPrompt = `
    Analyze this user's daily financial activity (all amounts in INR):
    - Total Balance: ${formatINR(userData?.totalBalance)}
    - Daily Transactions: ${JSON.stringify(userData?.expenses?.filter(exp =>
      new Date(exp.date).toDateString() === new Date().toDateString()
    ))}
    - Daily Income: ${formatINR(userData?.accounts?.reduce((sum, acc) =>
      sum + (acc.isRecurringIncome ? acc.recurringAmount / 30 : 0), 0))}

    Provide 3 specific, actionable daily insights.
    Format as bullet points without introductory text.`;

  const weeklyPrompt = `
    Analyze weekly financial activity:
    - Weekly Expenses: ${JSON.stringify(getDateRangeExpenses(7))}
    - Weekly Income: ${formatINR(userData?.accounts?.reduce((sum, acc) =>
      sum + (acc.isRecurringIncome ? acc.recurringAmount / 4 : 0), 0))}
    - Savings Goal Progress: ${formatINR(userData?.savingsGoal)}

    Provide 3 actionable weekly insights.`;

  const monthlyPrompt = `
    Analyze monthly financial activity:
    - Monthly Income: ${formatINR(userData?.accounts?.reduce((sum, acc) =>
      sum + (acc.isRecurringIncome ? acc.recurringAmount : 0), 0))}
    - Monthly Expenses: ${JSON.stringify(getDateRangeExpenses(30))}
    - Monthly Savings: ${formatINR(userData?.monthlySavings)}

    Provide 3 actionable monthly insights.`;

  const yearlyPrompt = `
    Analyze yearly trajectory:
    - Annual Income: ${formatINR(userData?.accounts?.reduce((sum, acc) =>
      sum + (acc.isRecurringIncome ? acc.recurringAmount * 12 : 0), 0))}
    - Savings Goal: ${formatINR(userData?.savingsGoal)}
    - Investment Portfolio: ${userData?.investments || 'None'}

    Provide 3 actionable yearly insights.`;

  return { dailyPrompt, weeklyPrompt, monthlyPrompt, yearlyPrompt };
};

const Insights = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [insights, setInsights] = useState({
    daily: [], weekly: [], monthly: [], yearly: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      toast.error("You're offline. Please check your Internet Connection.", {
        toastId: "offline-toast", autoClose: false, closeOnClick: false, draggable: false
      });
    };
    const handleOnline = () => toast.dismiss("offline-toast");

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const fetchDataAndGenerateInsights = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (!user) return navigate("/login");
          setUser(user);

          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserData(userData);

            const prompts = generatePrompts(userData);
            const [daily, weekly, monthly, yearly] = await Promise.all([
              model.generateContent(prompts.dailyPrompt),
              model.generateContent(prompts.weeklyPrompt),
              model.generateContent(prompts.monthlyPrompt),
              model.generateContent(prompts.yearlyPrompt)
            ]);

            setInsights({
              daily: daily.response.text().split('\n').filter(Boolean).map(formatInsight),
              weekly: weekly.response.text().split('\n').filter(Boolean).map(formatInsight),
              monthly: monthly.response.text().split('\n').filter(Boolean).map(formatInsight),
              yearly: yearly.response.text().split('\n').filter(Boolean).map(formatInsight),
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

  const renderInsight = (insight, index) => {
    const [title, content] = insight.includes(': ') ? insight.split(': ') : [null, insight];
    return (
      <li key={index} className="flex items-start">
        <span className="flex-shrink-0 w-4 h-4 mt-1 mr-2 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
        </span>
        <span className="text-gray-700 dark:text-gray-200">
          {title ? <><span className="font-semibold">{title}: </span>{content}</> : content}
        </span>
      </li>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-indigo-500 mr-2" />
        <span className="text-lg">Generating insights...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-20"
               onClick={() => setIsSidebarOpen(false)} />
        )}

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />

        <div className="flex-1 flex flex-col">
          <header className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  AI Financial Insights
                </h2>
                <div className="flex items-center gap-4">
                  <DarkModeToggle />
                  <ProfileButton
                    user={user}
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onLogout={() => auth.signOut()}
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto space-y-6">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                Personalized Financial Recommendations
              </h2>

              {/* Sections */}
              {["daily", "weekly", "monthly", "yearly"].map((section) => (
                <div key={section} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className={`font-semibold text-lg mb-4 ${{
                    daily: "text-blue-600",
                    weekly: "text-green-600",
                    monthly: "text-purple-600",
                    yearly: "text-orange-600"
                  }[section]}`}>{section[0].toUpperCase() + section.slice(1)} Insights</h3>
                  <ul className="space-y-3">
                    {insights[section].map((insight, i) =>
                      renderInsight(insight, `${section}-${i}`))}
                  </ul>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      <ToastContainer position="top-center" />
    </div>
  );
};

export default Insights;
