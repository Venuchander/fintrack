import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { useTranslation } from 'react-i18next';

const FinancialCharts = ({ incomeVsExpenseData, expenseData }) => {
  const { t } = useTranslation();

  if (!incomeVsExpenseData || !expenseData) return null;

  const hasIncomeData =
    incomeVsExpenseData?.datasets?.some(
      (dataset) => Array.isArray(dataset.data) && dataset.data.some((value) => value > 0)
    );

  const hasExpenseData =
    expenseData?.datasets?.some(
      (dataset) => Array.isArray(dataset.data) && dataset.data.some((value) => value > 0)
    );

  if (!hasIncomeData && !hasExpenseData) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {hasIncomeData && (
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.charts.incomeVsExpense')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <Bar
              data={incomeVsExpenseData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { stacked: false },
                  y: { stacked: false, beginAtZero: true },
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      {hasExpenseData && (
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.charts.expenseBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <Doughnut
              data={expenseData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialCharts;
