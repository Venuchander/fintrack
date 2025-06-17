import React from 'react';
import { Wifi } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

const CreditCards = ({ accounts, formatCurrency, getCardBackground }) => {
  const creditCards = accounts.filter(account => account.type === "Credit");
  
  if (creditCards.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 animate__animated animate__fadeInDown">Credit Cards</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 animate__animated animate__fadeInUp" >
        {creditCards.map((account, index) => (
          <Card key={index} className="overflow-hidden" data-aos="fade-up">
            <CardContent className="p-0">
              <div
                className={`h-48 p-6 flex flex-col justify-between bg-gradient-to-br ${getCardBackground(
                  account.cardType
                )}`}
              >
                <div className="flex justify-between items-start">
                  <Wifi className="h-8 w-8 text-white opacity-75 animate__animated animate__fadeInRight" />
                  <div className="text-white text-right">
                    <p className="font-bold animate__animated animate__fadeInUp">{account.name}</p>
                    <p className="text-sm opacity-75 animate__animated animate__fadeInUp">
                      Valid thru: {account.expiryDate}
                    </p>
                  </div>
                </div>
                <div className="text-white">
                  <div className="mb-4">
                    <span className="text-xl tracking-widest animate__animated animate__fadeInRight">
                      •••• •••• ••••{" "}
                      {account.cardNumber?.slice(-4) || "****"}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs opacity-75 animate__animated animate__fadeInUp">Available Credit</p>
                      <p className="font-bold animate__animated animate__fadeInUp">
                        {formatCurrency(
                          account.creditAmount - Math.abs(account.balance)
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs opacity-75 animate__animated animate__fadeInUp">Total Credit</p>
                      <p className="font-bold animate__animated animate__fadeInUp">
                        {formatCurrency(account.creditAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-2">
                  <p className="text-sm text-gray-600 animate__animated animate__fadeInDown">Credit Utilization</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${
                          (Math.abs(account.balance) /
                            account.creditAmount) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 animate__animated animate__fadeInUp">
                  Current Balance:{" "}
                  {formatCurrency(Math.abs(account.balance))}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CreditCards;