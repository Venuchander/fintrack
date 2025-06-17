import React from 'react';
import { Bar, Doughnut } from "react-chartjs-2";
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

const FinancialCharts = ({ incomeVsExpenseData, expenseData }) => {
  if (!incomeVsExpenseData || !expenseData) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate__animated animate__fadeInUp" >
      <Card data-aos="fade-up">
        <CardHeader>
          <CardTitle className="animate__animated animate__fadeInRight">Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] animate__animated animate__fadeInRight">
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
      <Card data-aos="fade-up">
        <CardHeader>
          <CardTitle className="animate__animated animate__fadeInRight">Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] animate__animated animate__fadeInRight">
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