import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./lib/firebase";
import ProfileButton from "../components/components/profile";
import Sidebar from "../components/components/Sidebar";
import { getUserData, updateUserAccounts } from "./lib/userService";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { CreditCard, Wallet, Building, DollarSign, Plus, Edit, Trash2 } from 'lucide-react';

const iconMap = {
  "Bank": <Building className="w-5 h-5" />,
  "Cash": <DollarSign className="w-5 h-5" />,
  "Credit": <CreditCard className="w-5 h-5" />,
};

const getIconComponent = (iconType) => {
  return iconMap[iconType] || <Wallet className="w-5 h-5" />;
};

export default function IncomeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [newAccount, setNewAccount] = useState({
    type: "",
    name: "",
    balance: "",
    bankName: "",
    creditCardName: "",
    cardType: "",
    expiryDate: "",
    creditAmount: "",
    isRecurringIncome: false,
    recurringAmount: "",
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editingField, setEditingField] = useState("");
  const [recurringIncome, setRecurringIncome] = useState({ amount: 0, type: "" });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        try {
          const userData = await getUserData(user.uid);
          if (userData?.accounts) {
            const displayAccounts = userData.accounts.map(account => ({
              ...account,
              icon: getIconComponent(account.type || account.name)
            }));
            setAccounts(displayAccounts);
            // Calculate total including credit card balances
            const total = displayAccounts.reduce((sum, account) => {
              if (account.type === "Credit") {
                return sum + account.balance;
              }
              return sum + account.balance;
            }, 0);
            setTotalBalance(total);
            const passiveSalaryAccount = displayAccounts.find(account => account.name === "Passive/Salary");
            if (passiveSalaryAccount) {
              setRecurringIncome({ amount: passiveSalaryAccount.balance, type: "Passive/Salary" });
            }
          }
        } catch (error) {
          console.error("Error fetching accounts:", error);
        }
      } else {
        navigate("/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleValueChange = async (index, newValue) => {
    try {
      const updatedAccounts = [...accounts];
      if (editingField === 'balance') {
        updatedAccounts[index].balance = Number(newValue);
      } else if (editingField === 'recurringAmount') {
        updatedAccounts[index].recurringAmount = Number(newValue);
      }
      setAccounts(updatedAccounts);
      setEditingId(null);
      setEditingField("");
      setEditValue("");

      if (user) {
        // Calculate new total including credit card balances
        const newTotal = updatedAccounts.reduce((sum, account) => {
          if (account.type === "Credit") {
            return sum + account.balance;
          }
          return sum + account.balance;
        }, 0);
        setTotalBalance(newTotal);
        await updateUserAccounts(user.uid, updatedAccounts);
      }
    } catch (error) {
      console.error("Error updating account:", error);
    }
  };

  const handleAddAccount = async () => {
    if (newAccount.type && newAccount.balance) {
      try {
        const accountToAdd = {
          type: newAccount.type,
          name: newAccount.type === "Bank" ? newAccount.bankName :
                newAccount.type === "Credit" ? newAccount.creditCardName :
                "Cash",
          balance: Number(newAccount.balance),
          icon: getIconComponent(newAccount.type),
          isRecurringIncome: newAccount.type === "Bank" ? newAccount.isRecurringIncome : false,
          recurringAmount: newAccount.type === "Bank" && newAccount.isRecurringIncome ? Number(newAccount.recurringAmount) : 0,
        };

        if (newAccount.type === "Credit") {
          accountToAdd.cardType = newAccount.cardType;
          accountToAdd.expiryDate = newAccount.expiryDate;
          accountToAdd.creditAmount = Number(newAccount.creditAmount);
        }

        const updatedAccounts = [...accounts, accountToAdd];
        setAccounts(updatedAccounts);

        if (user) {
          // Calculate new total including credit card balances
          const newTotal = updatedAccounts.reduce((sum, account) => {
            if (account.type === "Credit") {
              return sum + account.balance;
            }
            return sum + account.balance;
          }, 0);
          setTotalBalance(newTotal);
          await updateUserAccounts(user.uid, updatedAccounts);
        }

        setNewAccount({
          type: "",
          name: "",
          balance: "",
          bankName: "",
          creditCardName: "",
          cardType: "",
          expiryDate: "",
          creditAmount: "",
          isRecurringIncome: false,
          recurringAmount: "",
        });
        setIsAddingAccount(false);
      } catch (error) {
        console.error("Error adding account:", error);
      }
    }
  };

  const handleDeleteAccount = async (index) => {
    try {
      const updatedAccounts = accounts.filter((_, i) => i !== index);
      setAccounts(updatedAccounts);

      if (user) {
        const result = await updateUserAccounts(user.uid, updatedAccounts);
        setTotalBalance(result.totalBalance);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const handleRecurringIncome = async () => {
    try {
      const updatedAccounts = accounts.map(account => {
        if (account.isRecurringIncome) {
          return { ...account, balance: account.balance + account.recurringAmount };
        }
        return account;
      });
      setAccounts(updatedAccounts);

      if (user) {
        const result = await updateUserAccounts(user.uid, updatedAccounts);
        setTotalBalance(result.totalBalance);
      }
    } catch (error) {
      console.error("Error adding recurring income:", error);
    }
  };

  const handleEdit = (index, field) => {
    setEditingId(index);
    setEditingField(field);
    setEditValue(accounts[index][field].toString());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
      />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm animate__animated animate__fadeInDown">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-2xl font-semibold text-gray-900 animate__animated animate__slideInDown">Income Dashboard</h2>
              <ProfileButton
                user={user}
                onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onLogout={() => auth.signOut()}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4">
            <Card className="mb-8 bg-primary text-primary-foreground animate__animated animate__fadeInDown">
              <CardHeader>
                <CardDescription className="text-primary-foreground/70 animate__animated animate__fadeInDown">Total Balance</CardDescription>
                <CardTitle className="text-4xl font-bold animate__animated animate__fadeInUp">₹{totalBalance.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold px-1 animate__animated animate__fadeInUp">Accounts</h2>
              <div className="grid gap-4">
                {accounts.map((account, index) => (
                  <Card key={index} className="group hover:shadow-md transition-shadow animate__animated animate__fadeInUp">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-primary/10 text-primary animate__animated animate__fadeInLeft">
                            {account.icon}
                          </div>
                          <div>
                            <h3 className="font-medium animate__animated animate__fadeInDown">{account.name}</h3>
                            {editingId === index && editingField === 'balance' ? (
                              <Input
                                type="number"
                                value={editValue}
                                className="w-32 text-sm animate__animated animate__fadeInUp"
                                autoFocus
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleValueChange(index, editValue)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleValueChange(index, editValue);
                                  }
                                }}
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground animate__animated animate__fadeInUp">
                                Balance: ₹{account.balance.toLocaleString()}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 animate__animated animate__fadeInLeft"
                                  onClick={() => handleEdit(index, 'balance')}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </p>
                            )}
                            {account.type === "Credit" && (
                              <>
                                <p className="text-sm text-muted-foreground animate__animated animate__fadeInUp">Type: {account.cardType}</p>
                                <p className="text-sm text-muted-foreground animate__animated animate__fadeInUp">Expires: {account.expiryDate}</p>
                                <p className="text-sm text-muted-foreground animate__animated animate__fadeInUp">Credit Limit: ₹{account.creditAmount.toLocaleString()}</p>
                              </>
                            )}
                            {account.isRecurringIncome && (
                              editingId === index && editingField === 'recurringAmount' ? (
                                <Input
                                  type="number"
                                  value={editValue}
                                  className="w-32 text-sm animate__animated animate__fadeInUp"
                                  autoFocus
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleValueChange(index, editValue)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleValueChange(index, editValue);
                                    }
                                  }}
                                />
                              ) : (
                                <p className="text-sm text-green-600 animate__animated animate__fadeInUp">
                                  Monthly Income: ₹{account.recurringAmount.toLocaleString()}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 animate__animated animate__fadeInLeft"
                                    onClick={() => handleEdit(index, 'recurringAmount')}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </p>
                              )
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive animate__animated animate__slideInRight"
                            onClick={() => handleDeleteAccount(index)}
                          >
                            <Trash2 className="w-4 h-4 animate__animated animate__fadeInRight" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
                <DialogTrigger asChild>
                  <Button className="w-full animate__animated animate__fadeInUp" size="lg">
                    <Plus className="w-5 h-5 mr-2 animate__animated animate__fadeInLeft" />
                    <span className="animate__animated animate__fadeInRight">Add New Account</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="animate__animated animate__fadeInDown">Add New Account</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="accountType" className="text-right animate__animated animate__fadeInUp">
                        Type
                      </Label>
                      <Select
                        className="animate__animated animate__fadeInUp"
                        value={newAccount.type}
                        onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}
                      >
                        <SelectTrigger id="accountType" className="col-span-3">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bank" className="animate__animated animate__fadeInUp">Bank</SelectItem>
                          <SelectItem value="Cash" className="animate__animated animate__fadeInUp">Cash</SelectItem>
                          <SelectItem value="Credit" className="animate__animated animate__fadeInUp">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newAccount.type === "Bank" && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bankName" className="text-right animate__animated animate__fadeInUp">
                          Bank Name
                        </Label>
                        <Input
                          id="bankName"
                          value={newAccount.bankName}
                          onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                          className="col-span-3 animate__animated animate__fadeInUp"
                        />
                      </div>
                    )}
                    {newAccount.type === "Credit" && (
                      <>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="creditCardName" className="text-right animate__animated animate__fadeInUp">
                            Credit Card Name
                          </Label>
                          <Input
                            id="creditCardName"
                            value={newAccount.creditCardName}
                            onChange={(e) => setNewAccount({ ...newAccount, creditCardName: e.target.value })}
                            className="col-span-3 animate__animated animate__fadeInUp"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="cardType" className="text-right animate__animated animate__fadeInUp">
                            Card Type
                          </Label>
                          <Select
                            value={newAccount.cardType}
                            onValueChange={(value) => setNewAccount({ ...newAccount, cardType: value })}
                          >
                            <SelectTrigger id="cardType" className="col-span-3">
                              <SelectValue placeholder="Select card type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem className="animate__animated animate__fadeInUp" value="Visa">Visa</SelectItem>
                              <SelectItem className="animate__animated animate__fadeInUp" value="Mastercard">Mastercard</SelectItem>
                              <SelectItem className="animate__animated animate__fadeInUp" value="American Express">American Express</SelectItem>
                              <SelectItem className="animate__animated animate__fadeInUp" value="Discover">Discover</SelectItem>
                              <SelectItem className="animate__animated animate__fadeInUp" value="RuPay">RuPay</SelectItem>
                              <SelectItem className="animate__animated animate__fadeInUp" value="UnionPay">UnionPay</SelectItem>
                              <SelectItem className="animate__animated animate__fadeInUp" value="JCB">JCB</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="expiryDate" className="text-right animate__animated animate__fadeInUp">
                            Expiry Date
                          </Label>
                          <Input
                            id="expiryDate"
                            type="month"
                            value={newAccount.expiryDate}
                            onChange={(e) => setNewAccount({ ...newAccount, expiryDate: e.target.value })}
                            className="col-span-3 animate__animated animate__fadeInUp"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="creditAmount" className="text-right animate__animated animate__fadeInUp">
                            Credit Amount
                          </Label>
                          <Input
                            id="creditAmount"
                            type="number"
                            value={newAccount.creditAmount}
                            onChange={(e) => setNewAccount({ ...newAccount, creditAmount: e.target.value })}
                            className="col-span-3 animate__animated animate__fadeInUp"
                          />
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="balance" className="text-right animate__animated animate__fadeInUp">
                        Balance
                      </Label>
                      <Input
                        id="balance"
                        type="number"
                        value={newAccount.balance}
                        onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                        className="col-span-3 animate__animated animate__fadeInUp"
                      />
                    </div>
                    {newAccount.type === "Bank" && (
                      <>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="isRecurringIncome" className="text-right animate__animated animate__fadeInUp">
                            Recurring Income
                          </Label>
                          <Switch
                            id="isRecurringIncome"
                            checked={newAccount.isRecurringIncome}
                            onCheckedChange={(checked) => setNewAccount({ ...newAccount, isRecurringIncome: checked })}
                          />
                        </div>
                        {newAccount.isRecurringIncome && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="recurringAmount" className="text-right animate__animated animate__fadeInUp">
                              Monthly Amount
                            </Label>
                            <Input
                              id="recurringAmount"
                              type="number"
                              value={newAccount.recurringAmount}
                              onChange={(e) => setNewAccount({ ...newAccount, recurringAmount: e.target.value })}
                              className="col-span-3 animate__animated animate__fadeInUp"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <Button onClick={handleAddAccount} className="animate__animated animate__fadeInUp"><span className="animate__animated animate__fadeInRight">Add Account</span></Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
