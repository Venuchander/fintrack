import React from 'react';
import { Wallet, ReceiptIndianRupeeIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

const BankAccounts = ({ accounts, formatCurrency }) => {
  const bankAccounts = accounts.filter(account => account.type !== "Credit");
  
  if (bankAccounts.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Bank Accounts</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bankAccounts.map((account, index) => (
          <Card
            key={index}
             className="rounded-lg border bg-card text-gray-900 dark:text-white shadow-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">
                  {account.name}
                </CardTitle>
                {!(account.type === "Cash" || account.name.toLowerCase() === "cash") && (
                  <CardDescription>{account.type}</CardDescription>
                )}
              </div>
              {(account.type === "Cash" || account.name.toLowerCase() === "cash") ? (
                <ReceiptIndianRupeeIcon className="h-5 w-5 text-blue-600" />
              ) : (
                <Wallet className="h-5 w-5 text-blue-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(account.balance)}
              </div>
              {account.isRecurringIncome && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  {/* Commenting out as in original code
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Monthly Income: {formatCurrency(account.recurringAmount)} */}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BankAccounts;