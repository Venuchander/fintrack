import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./lib/firebase";
import ProfileButton from "./profile";
import Sidebar from "./Sidebar";
import { getUserData, updateUserAccounts } from "./lib/userService";
import { Button } from "../components/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/components/ui/card";
import { Input } from "../components/components/ui/input";
import { Label } from "../components/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/components/ui/select";
import { CreditCard, Wallet, PiggyBank, DollarSign, Smartphone, Bitcoin, Plus, Edit, Trash2 } from 'lucide-react';

const iconMap = {
  "Credit Card": <CreditCard className="w-5 h-5" />,
  "Debit Card": <Wallet className="w-5 h-5" />,
  "Savings": <PiggyBank className="w-5 h-5" />,
  "Cash": <DollarSign className="w-5 h-5" />,
  "UPI": <Smartphone className="w-5 h-5" />,
  "Bit Coin": <Bitcoin className="w-5 h-5" />,
  "Passive/Salary": <DollarSign className="w-5 h-5 text-green-500" />,
};

const getIconComponent = (iconType) => {
  return iconMap[iconType] || <CreditCard className="w-5 h-5" />;
};

export default function IncomeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [newAccount, setNewAccount] = useState({ name: "", balance: "" });
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [recurringIncome, setRecurringIncome] = useState({ amount: 0, type: '' });
  const [editValue, setEditValue] = useState(""); // Added state for edit value

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        try {
          const userData = await getUserData(user.uid);
          if (userData?.accounts) {
            const displayAccounts = userData.accounts.map(account => ({
              ...account,
              icon: getIconComponent(account.iconType || account.name)
            }));
            setAccounts(displayAccounts);
            setTotalBalance(userData.totalBalance || 0);
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
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getDate() === 1 && recurringIncome.amount > 0) {
        handleRecurringIncome();
      }
    }, 24 * 60 * 60 * 1000); // Check once a day

    return () => clearInterval(timer);
  }, [recurringIncome]);

  const handleEdit = (index) => {
    setEditingId(index === editingId ? null : index);
    setEditValue(accounts[index].balance.toString()); // Set initial edit value
  };

  const handleBalanceChange = async (index, newBalance) => {
    try {
      const updatedAccounts = [...accounts];
      updatedAccounts[index].balance = Number(newBalance);
      setAccounts(updatedAccounts);
      setEditingId(null);
      setEditValue(""); // Clear edit value after update

      if (user) {
        const result = await updateUserAccounts(user.uid, updatedAccounts);
        setTotalBalance(result.totalBalance);
      }
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };

  const handleAddAccount = async () => {
    if (newAccount.name && newAccount.balance) {
      try {
        const newAccountWithIcon = {
          name: newAccount.name,
          balance: Number(newAccount.balance),
          iconType: newAccount.name,
          icon: getIconComponent(newAccount.name),
          isRecurring: newAccount.name === "Passive/Salary",
          recurringAmount: newAccount.name === "Passive/Salary" ? Number(newAccount.balance) : 0
        };

        const updatedAccounts = [...accounts, newAccountWithIcon];
        setAccounts(updatedAccounts);
        
        if (user) {
          const result = await updateUserAccounts(user.uid, updatedAccounts);
          setTotalBalance(result.totalBalance);
          if (newAccount.name === "Passive/Salary") {
            setRecurringIncome({ amount: Number(newAccount.balance), type: "Passive/Salary" });
          }
        }

        setNewAccount({ name: "", balance: "" });
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
        if (account.isRecurring) {
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-2xl font-semibold text-gray-900">Income Dashboard</h2>
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
            <Card className="mb-8 bg-primary text-primary-foreground">
              <CardHeader>
                <CardDescription className="text-primary-foreground/70">Total Balance</CardDescription>
                <CardTitle className="text-4xl font-bold">₹{totalBalance.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold px-1">Accounts</h2>
              <div className="grid gap-4">
                {accounts.map((account, index) => (
                  <Card key={index} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-primary/10 text-primary">
                            {account.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">{account.name}</h3>
                            {editingId === index ? (
                              <Input
                                type="number"
                                value={editValue}
                                className="w-32 text-sm"
                                autoFocus
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleBalanceChange(index, editValue)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleBalanceChange(index, editValue);
                                  }
                                }}
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Balance: ₹{account.balance.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEdit(index)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            onClick={() => handleDeleteAccount(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Account</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Type
                      </Label>
                      <Select
                        value={newAccount.name}
                        onValueChange={(value) => setNewAccount({ ...newAccount, name: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Debit Card">Debit Card</SelectItem>
                          <SelectItem value="Savings">Savings</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Bit Coin">Bit Coin</SelectItem>
                          <SelectItem value="Passive/Salary">Passive/Salary Income</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="balance" className="text-right">
                        {newAccount.name === "Passive/Salary" ? "Monthly Amount" : "Balance"}
                      </Label>
                      <Input
                        id="balance"
                        type="number"
                        value={newAccount.balance}
                        onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddAccount}>Add Account</Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

