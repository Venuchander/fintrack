import React, { useState } from 'react';
import Layout from './Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/components/ui/card';
import { Input } from '../components/components/ui/input';
import { Label } from '../components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const Expenses = () => {
  const [income, setIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [timeline, setTimeline] = useState('monthly');
  const [expenses, setExpenses] = useState([
    { category: 'Housing', amount: 0 },
    { category: 'Utilities', amount: 0 },
    { category: 'Groceries', amount: 0 },
    { category: 'Entertainment', amount: 0 }
  ]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const handleExpenseChange = (index, value) => {
    const updatedExpenses = [...expenses];
    updatedExpenses[index].amount = parseFloat(value) || 0;
    setExpenses(updatedExpenses);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Layout>
    <div className="p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Income & Savings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="income">Total Income</Label>
            <Input
              id="income"
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="Enter your income"
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="savings-goal">Savings Goal</Label>
              <Input
                id="savings-goal"
                type="number"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                placeholder="Enter target amount"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="timeline">Timeline</Label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {expenses.map((expense, index) => (
                <div key={expense.category}>
                  <Label htmlFor={`expense-${index}`}>{expense.category}</Label>
                  <Input
                    id={`expense-${index}`}
                    type="number"
                    value={expense.amount}
                    onChange={(e) => handleExpenseChange(index, e.target.value)}
                    placeholder={`Enter ${expense.category.toLowerCase()} expenses`}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenses}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {expenses.map((entry, index) => (
                      <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </Layout>
  );
};

export default Expenses;