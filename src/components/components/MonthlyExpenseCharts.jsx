import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useTranslation } from "react-i18next";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MONTH_ORDER = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function MonthlyExpenseChart({ expenses }) {
  const { t } = useTranslation();
  const [monthlyCategoryData, setMonthlyCategoryData] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDark = () =>
      setIsDarkMode(document.documentElement.classList.contains("dark"));

    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!expenses || expenses.length === 0) {
      setMonthlyCategoryData({});
      return;
    }

    const grouped = {};

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      const key = `${month} ${year}`;

      if (!grouped[key]) grouped[key] = {};
      if (!grouped[key][expense.category]) grouped[key][expense.category] = 0;

      grouped[key][expense.category] += expense.amount;
    });

    setMonthlyCategoryData(grouped);
  }, [expenses]);

  const labels = Object.keys(monthlyCategoryData).sort((a, b) => {
    const [monthA, yearA] = a.split(" ");
    const [monthB, yearB] = b.split(" ");
    const indexA = MONTH_ORDER.indexOf(monthA);
    const indexB = MONTH_ORDER.indexOf(monthB);
    return yearA - yearB || indexA - indexB;
  });

  const allCategories = Array.from(
    new Set(
      Object.values(monthlyCategoryData).flatMap((monthData) =>
        Object.keys(monthData)
      )
    )
  );

  const softColors = [
    "#4F46E5", "#38BDF8", "#F472B6", "#F59E0B",
    "#34D399", "#A78BFA", "#FB7185", "#22D3EE",
  ];

  const chartData = {
    labels,
    datasets: allCategories.map((category, index) => ({
      label: category,
      data: labels.map((label) => monthlyCategoryData[label]?.[category] || 0),
      backgroundColor: softColors[index % softColors.length],
      barThickness: 30,
      barPercentage: 0.7,
      categoryPercentage: 0.65,
    })),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 14 },
          color: isDarkMode ? "#D1D5DB" : "#374151",
          usePointStyle: true,
          pointStyle: "rectRounded",
          padding: 20,
        },
      },
      title: {
        display: true,
        text: "Monthly Expenses by Category",
        font: { size: 20, weight: "bold" },
        color: isDarkMode ? "#F9FAFB" : "#111827",
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB",
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
        cornerRadius: 6,
        padding: 10,
        boxPadding: 4,
        titleColor: isDarkMode ? "#E5E7EB" : "#111827",
        bodyColor: isDarkMode ? "#E5E7EB" : "#111827",
      },
    },
    layout: {
      padding: 12,
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 13 },
          color: isDarkMode ? "#D1D5DB" : "#6B7280",
        },
      },
      y: {
        beginAtZero: true,
        stacked: true,
        grid: {
          color: isDarkMode ? "#374151" : "#E5E7EB",
        },
        ticks: {
          font: { size: 13 },
          color: isDarkMode ? "#D1D5DB" : "#6B7280",
          stepSize: 500,
        },
      },
    },
  };

  if (!expenses || expenses.length === 0) {
    return (
      <p className="text-center mt-6 text-gray-500 dark:text-gray-300">
        {t("dashboard.no")}
      </p>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8 max-w-full transition-colors">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[500px] h-[400px]">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default MonthlyExpenseChart;
