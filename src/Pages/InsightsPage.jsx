import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { auth } from "./lib/firebase";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ProfileButton from '../components/components/profile';
import Sidebar from '../components/components/Sidebar';
import { Loader2 } from 'lucide-react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSidebar } from '../contexts/SidebarContext';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEN_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

const Insights = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [insights, setInsights] = useState({ daily: [], weekly: [], monthly: [], yearly: [] });
  const [isLoading, setIsLoading] = useState(true);
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar();

  const formatINR = (amount) => `${t('common.currency')}${amount?.toLocaleString('en-IN') || 0}`;

  const getDateRangeExpenses = (days) => {
    return userData?.expenses?.filter(exp => new Date(exp.date) >= new Date(Date.now() - days * 24 * 60 * 60 * 1000));
  };

  const generatePrompts = (userData) => {
    const dailyPrompt = `
      ${t('insights.prompts.daily.analysisText')}
      - ${t('insights.dataLabels.totalBalance')}: ${formatINR(userData?.totalBalance)}
      - ${t('insights.dataLabels.dailyTransactions')}: ${JSON.stringify(userData?.expenses?.filter(exp => new Date(exp.date).toDateString() === new Date().toDateString()))}
      - ${t('insights.dataLabels.dailyIncome')}: ${formatINR(userData?.accounts?.reduce((sum, acc) => sum + (acc.isRecurringIncome ? acc.recurringAmount / 30 : 0), 0))}
      ${t('insights.instructions.focusOn', { timeframe: t('insights.instructions.timeframes.daily') })}
      1. ${t('insights.prompts.daily.focusAreas.0')}
      2. ${t('insights.prompts.daily.focusAreas.1')}
      3. ${t('insights.prompts.daily.focusAreas.2')}
      ${t('insights.instructions.format')}`;

    const weeklyPrompt = `
      ${t('insights.prompts.weekly.analysisText')}
      - ${t('insights.dataLabels.weeklyExpenses')}: ${JSON.stringify(getDateRangeExpenses(7))}
      - ${t('insights.dataLabels.weeklyIncome')}: ${formatINR(userData?.accounts?.reduce((sum, acc) => sum + (acc.isRecurringIncome ? acc.recurringAmount / 4 : 0), 0))}
      - ${t('insights.dataLabels.savingsGoalProgress')}: ${formatINR(userData?.savingsGoal)}
      ${t('insights.instructions.focusOn', { timeframe: t('insights.instructions.timeframes.weekly') })}
      1. ${t('insights.prompts.weekly.focusAreas.0')}
      2. ${t('insights.prompts.weekly.focusAreas.1')}
      3. ${t('insights.prompts.weekly.focusAreas.2')}
      ${t('insights.instructions.format')}`;

    const monthlyPrompt = `
      ${t('insights.prompts.monthly.analysisText')}
      - ${t('insights.dataLabels.monthlyIncome')}: ${formatINR(userData?.accounts?.reduce((sum, acc) => sum + (acc.isRecurringIncome ? acc.recurringAmount : 0), 0))}
      - ${t('insights.dataLabels.monthlyExpenses')}: ${JSON.stringify(getDateRangeExpenses(30))}
      - ${t('insights.dataLabels.monthlySavings')}: ${formatINR(userData?.monthlySavings)}
      ${t('insights.instructions.focusOn', { timeframe: t('insights.instructions.timeframes.monthly') })}
      1. ${t('insights.prompts.monthly.focusAreas.0')}
      2. ${t('insights.prompts.monthly.focusAreas.1')}
      3. ${t('insights.prompts.monthly.focusAreas.2')}
      ${t('insights.instructions.format')}`;

    const yearlyPrompt = `
      ${t('insights.prompts.yearly.analysisText')}
      - ${t('insights.dataLabels.annualIncome')}: ${formatINR(userData?.accounts?.reduce((sum, acc) => sum + (acc.isRecurringIncome ? acc.recurringAmount * 12 : 0), 0))}
      - ${t('insights.dataLabels.savingsGoal')}: ${formatINR(userData?.savingsGoal)}
      - ${t('insights.dataLabels.investmentPortfolio')}: ${userData?.investments || t('insights.dataLabels.none')}
      ${t('insights.instructions.focusOn', { timeframe: t('insights.instructions.timeframes.yearly') })}
      1. ${t('insights.prompts.yearly.focusAreas.0')}
      2. ${t('insights.prompts.yearly.focusAreas.1')}
      3. ${t('insights.prompts.yearly.focusAreas.2')}
      ${t('insights.instructions.format')}`;

    return { dailyPrompt, weeklyPrompt, monthlyPrompt, yearlyPrompt };
  };

  useEffect(() => {
    const handleOffline = () => {
      toast.error(t('insights.offline'), {
        toastId: "offline-toast",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      });
    };
    const handleOnline = () => toast.dismiss("offline-toast");
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [t]);

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
        console.error(t('insights.error'), error);
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
        <span className="text-base text-gray-800 dark:text-gray-100 leading-relaxed">
          {title ? <><span className="font-semibold">{title}:</span> {content}</> : content}
        </span>
      </li>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-indigo-500 mr-2" />
        <span className="text-lg">{t('insights.loading')}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={closeSidebar} />}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} user={user} />
        <div className="flex-1 flex flex-col">
          <header className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('insights.title')}</h2>
                <ProfileButton user={user} onMenuToggle={toggleSidebar} onLogout={() => auth.signOut()} />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto space-y-6">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">{t('insights.subtitle')}</h2>
              {["daily", "weekly", "monthly", "yearly"].map((section) => (
                <div
                  key={section}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-6"
                >
                  <div className="mb-4">
                    <h3 className={`font-semibold text-lg text-${section === 'daily' ? 'blue' : section === 'weekly' ? 'green' : section === 'monthly' ? 'purple' : 'orange'}-600`}>
                      {t(`insights.sections.${section}.title`)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {t(`insights.sections.${section}.description`)}
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {insights[section].map((insight, i) => renderInsight(insight, `${section}-${i}`))}
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
