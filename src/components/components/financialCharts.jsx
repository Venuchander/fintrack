import React from 'react';
import { Bar, Doughnut } from "react-chartjs-2";
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

const FinancialCharts = ({ incomeVsExpenseData, expenseData }) => {
  if (!incomeVsExpenseData || !expenseData) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Bar 
            data={incomeVsExpenseData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { stacked: false },
                y: { stacked: false, beginAtZero: true }
              }
            }} 
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Doughnut 
            data={expenseData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialCharts;