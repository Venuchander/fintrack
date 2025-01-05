import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Insights = () => {
  const spendingData = [
    { month: 'Jan', spending: 2400, savings: 1000 },
    { month: 'Feb', spending: 1398, savings: 1200 },
    { month: 'Mar', spending: 9800, savings: 800 },
    { month: 'Apr', spending: 3908, savings: 1400 },
    { month: 'May', spending: 4800, savings: 1500 },
    { month: 'Jun', spending: 3800, savings: 1700 },
  ];

  return (
    <div className="p-6">
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
  );
};

export default Insights;