import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./lib/firebase";
import ProfileButton from "../components/components/profile";
import Sidebar from "../components/components/Sidebar";
import { getUserData, updateUserAccounts } from "./lib/userService";
import { Button } from "../components/ui/button";
import DarkModeToggle from "../components/ui/DarkModeToggle";
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
import {
  CreditCard,
  Wallet,
  Building,
  DollarSign,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

const iconMap = {
  Bank: <Building className="w-5 h-5" />,
  Cash: <DollarSign className="w-5 h-5" />,
  Credit: <CreditCard className="w-5 h-5" />,
};

const getIconComponent = (iconType) => {
  return iconMap[iconType] || <Wallet className="w-5 h-5" />;
};

export default function IncomeDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const [recurringIncome, setRecurringIncome] = useState({
    amount: 0,
    type: "",
  });
  const [isAddAmountDialogOpen, setIsAddAmountDialogOpen] = useState(false);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(null);
  const [additionalAmount, setAdditionalAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // New state for balance validation
  const [balanceError, setBalanceError] = useState("");

  useEffect(() => {
    const handleOffline = () => {
      toast.error(t('income.offline'), {
        toastId: "offline-toast",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      });
    };

    const handleOnline = () => {
      toast.dismiss("offline-toast");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [t]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        try {
          const userData = await getUserData(user.uid);
          if (userData?.accounts) {
            const displayAccounts = userData.accounts.map((account) => ({
              ...account,
              icon: getIconComponent(account.type || account.name),
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
            const passiveSalaryAccount = displayAccounts.find(
              (account) => account.name === "Passive/Salary"
            );
            if (passiveSalaryAccount) {
              setRecurringIncome({
                amount: passiveSalaryAccount.balance,
                type: "Passive/Salary",
              });
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

  const handleEdit = (index, field) => {
    setEditingId(index);
    setEditingField(field);
    setEditValue(accounts[index][field].toString());
  };

  const handleValueChange = async (index, newValue) => {
    try {
      const updatedAccounts = [...accounts];
      if (editingField === "balance") {
        updatedAccounts[index].balance = Number(newValue);
      } else if (editingField === "recurringAmount") {
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

  // Function to validate balance
  const validateBalance = (value) => {
    if (!value || value.trim() === "") {
      return t('income.form.balance.required');
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return t('income.form.balance.invalid');
    }
    if (numValue < 0) {
      return t('income.form.balance.negative');
    }
    return "";
  };

  const handleAddAccount = async () => {
    // Validate balance first
    const balanceValidationError = validateBalance(newAccount.balance);
    if (balanceValidationError) {
      setBalanceError(balanceValidationError);
      return;
    }

    if (newAccount.type === "Credit" && !/^[a-zA-Z][a-zA-Z\s\-'.]{1,49}$/.test(newAccount.creditCardName)) {
      alert(t('income.form.creditCardName.validation'));
      return;
    }
    if (newAccount.type && newAccount.balance) {
      try {
        const accountToAdd = {
          type: newAccount.type,
          name:
            newAccount.type === "Bank"
              ? newAccount.bankName
              : newAccount.type === "Credit"
              ? newAccount.creditCardName
              : "Cash",
          balance: Number(newAccount.balance),
          icon: getIconComponent(newAccount.type),
          isRecurringIncome:
            newAccount.type === "Bank" ? newAccount.isRecurringIncome : false,
          recurringAmount:
            newAccount.type === "Bank" && newAccount.isRecurringIncome
              ? Number(newAccount.recurringAmount)
              : 0,
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
        setBalanceError(""); // Clear error
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
      const updatedAccounts = accounts.map((account) => {
        if (account.isRecurringIncome) {
          return {
            ...account,
            balance: account.balance + account.recurringAmount,
          };
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

  const handleOpenAddAmountDialog = (index) => {
    setSelectedAccountIndex(index);
    setIsAddAmountDialogOpen(true);
  };

  const handleConfirmAddAmount = async () => {
    // Validate the amount
    if (!additionalAmount || Number(additionalAmount) <= 0) {
      setErrorMessage(t('income.dialogs.addAmount.validation'));
      return;
    }

    if (selectedAccountIndex !== null) {
      const updatedAccounts = [...accounts];
      updatedAccounts[selectedAccountIndex].balance += Number(additionalAmount);

      setAccounts(updatedAccounts); // update accounts
      const newTotal = updatedAccounts.reduce(
        (sum, acc) => sum + acc.balance,
        0
      );
      setTotalBalance(newTotal); 
      setIsAddAmountDialogOpen(false); // close dialog
      setAdditionalAmount(""); // reset input
      setErrorMessage(""); // clear error after success

      if (user) {
        await updateUserAccounts(user.uid, updatedAccounts); // persist to DB
      }
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex h-screen">
        <Sidebar
          isOpen={isSidebarOpen}
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
          <header className="bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">

                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {t('income.title')}

                </h2>
                <div className="flex items-center gap-4">
                 
                  <ProfileButton
                    user={user}
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onLogout={() => auth.signOut()}
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              <Card className="mb-8 bg-gray-900 text-white border border-white/20">
                <CardHeader>

                  <CardDescription className="text-sm font-medium text-white-500 dark:text-white">
                    {t('income.cards.totalBalance')}
                  </CardDescription>

                  <CardTitle className="text-4xl font-bold">
                    {t('common.currency')}{totalBalance.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold px-1">{t('income.accounts.title')}</h2>
                <div className="grid gap-4">
                  {accounts.map((account, index) => (
                    <Card
                      key={index}
                      className="group hover:shadow-md transition-shadow bg-gray-900 text-white border border-white/20"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                              {account.icon}
                            </div>
                            <div>
                              <h3 className="font-medium">{account.name}</h3>
                              {editingId === index &&
                              editingField === "balance" ? (
                                <Input
                                  type="number"
                                  value={editValue}
                                  className="w-32 text-sm"
                                  autoFocus
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() =>
                                    handleValueChange(index, editValue)
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleValueChange(index, editValue);
                                    }
                                  }}
                                />
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  {t('income.accounts.balance')}: {t('common.currency')}{account.balance.toLocaleString()}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2"
                                    onClick={() => handleEdit(index, "balance")}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </p>
                              )}
                              {account.type === "Credit" && (
                                <>
                                  <p className="text-sm text-muted-foreground">
                                    {t('income.accounts.type')}: {account.cardType}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {t('income.accounts.expires')}: {account.expiryDate}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {t('income.accounts.creditLimit')}: {t('common.currency')}
                                    {account.creditAmount.toLocaleString()}
                                  </p>
                                </>
                              )}
                              {account.isRecurringIncome &&
                                (editingId === index &&
                                editingField === "recurringAmount" ? (
                                  <Input
                                    type="number"
                                    value={editValue}
                                    className="w-32 text-sm"
                                    autoFocus
                                    onChange={(e) =>
                                      setEditValue(e.target.value)
                                    }
                                    onBlur={() =>
                                      handleValueChange(index, editValue)
                                    }
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") {
                                        handleValueChange(index, editValue);
                                      }
                                    }}
                                  />
                                ) : (
                                  <p className="text-sm text-green-600">
                                    {t('income.accounts.monthlyIncome')}: {t('common.currency')}
                                    {account.recurringAmount.toLocaleString()}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="ml-2"
                                      onClick={() =>
                                        handleEdit(index, "recurringAmount")
                                      }
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </p>
                                ))}
                            </div>
                          </div>
                          <div className="flex gap-1 items-center">
                            <Button
                              title={t('income.accounts.addFunds')}
                              variant="ghost"
                              size="icon"
                              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-green-600 hover:bg-green-50 rounded-full"
                              onClick={() => handleOpenAddAmountDialog(index)}
                            >
                              <Plus className="w-7 h-7" />
                            </Button>

                            <Button
                              title={t('income.accounts.deleteAccount')}
                              variant="ghost"
                              size="icon"
                              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-destructive hover:bg-red-50 rounded-full"
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

                <Dialog
                  open={isAddingAccount}
                  onOpenChange={(open) => {
                    setIsAddingAccount(open);
                    if (!open) {
                      // Clear error when dialog closes
                      setBalanceError("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      {t('income.buttons.addNewAccount')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="overlay-bubble bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-xl">
                    <DialogHeader>
                      <DialogTitle>{t('income.dialogs.addAccount.title')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accountType" className="text-right">
                          {t('income.form.accountType.label')}
                        </Label>
                        <Select
                          value={newAccount.type}
                          onValueChange={(value) =>
                            setNewAccount({ ...newAccount, type: value })
                          }
                        >
                          <SelectTrigger
                            id="accountType"
                            className="col-span-3"
                          >
                            <SelectValue placeholder={t('income.form.accountType.placeholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bank">{t('income.form.accountType.options.bank')}</SelectItem>
                            <SelectItem value="Cash">{t('income.form.accountType.options.cash')}</SelectItem>
                            <SelectItem value="Credit">{t('income.form.accountType.options.credit')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newAccount.type === "Bank" && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="bankName" className="text-right">
                            {t('income.form.bankName.label')}
                          </Label>
                          <Input
                            id="bankName"
                            value={newAccount.bankName}
                            onChange={(e) =>
                              setNewAccount({
                                ...newAccount,
                                bankName: e.target.value,
                              })
                            }
                            className="col-span-3"
                          />
                        </div>
                      )}
                      {newAccount.type === "Credit" && (
                        <>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="creditCardName"
                              className="text-right"
                            >
                              {t('income.form.creditCardName.label')}
                            </Label>
                            <Input
                              id="creditCardName"
                              value={newAccount.creditCardName}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^[a-zA-Z\s\-'.]*$/.test(value)) {
                                  setNewAccount({
                                    ...newAccount,
                                    creditCardName: value,
                                  });
                                }
                              }}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cardType" className="text-right">
                              {t('income.form.cardType.label')}
                            </Label>
                            <Select
                              value={newAccount.cardType}
                              onValueChange={(value) =>
                                setNewAccount({
                                  ...newAccount,
                                  cardType: value,
                                })
                              }
                            >
                              <SelectTrigger
                                id="cardType"
                                className="col-span-3"
                              >
                                <SelectValue placeholder={t('income.form.cardType.placeholder')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Visa">{t('income.form.cardType.options.visa')}</SelectItem>
                                <SelectItem value="Mastercard">{t('income.form.cardType.options.mastercard')}</SelectItem>
                                <SelectItem value="American Express">{t('income.form.cardType.options.americanExpress')}</SelectItem>
                                <SelectItem value="Discover">{t('income.form.cardType.options.discover')}</SelectItem>
                                <SelectItem value="RuPay">{t('income.form.cardType.options.rupay')}</SelectItem>
                                <SelectItem value="UnionPay">{t('income.form.cardType.options.unionpay')}</SelectItem>
                                <SelectItem value="JCB">{t('income.form.cardType.options.jcb')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="expiryDate" className="text-right">
                              {t('income.form.expiryDate.label')}
                            </Label>
                            <Input
                              id="expiryDate"
                              type="month"
                              value={newAccount.expiryDate}
                              onChange={(e) =>
                                setNewAccount({
                                  ...newAccount,
                                  expiryDate: e.target.value,
                                })
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="creditAmount"
                              className="text-right"
                            >
                              {t('income.form.creditAmount.label')}
                            </Label>
                            <Input
                              id="creditAmount"
                              type="number"
                              value={newAccount.creditAmount}
                              onChange={(e) =>
                                setNewAccount({
                                  ...newAccount,
                                  creditAmount: e.target.value,
                                })
                              }
                              className="col-span-3"
                            />
                          </div>
                        </>
                      )}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="balance" className="text-right">
                          {t('income.form.balance.label')}
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="balance"
                            type="number"
                            value={newAccount.balance}
                            onChange={(e) => {
                              setNewAccount({
                                ...newAccount,
                                balance: e.target.value,
                              });
                              // Clear error when user starts typing
                              if (balanceError) {
                                setBalanceError("");
                              }
                            }}
                            className={`${
                              balanceError ? "border-red-500 border-2" : ""
                            }`}
                          />
                          {balanceError && (
                            <p className="text-red-500 text-xs mt-1">
                              {balanceError}
                            </p>
                          )}
                        </div>
                      </div>
                      {newAccount.type === "Bank" && (
                        <>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="isRecurringIncome"
                              className="text-right"
                            >
                              {t('income.form.recurringIncome.label')}
                            </Label>
                            <Switch
                              id="isRecurringIncome"
                              checked={newAccount.isRecurringIncome}
                              onCheckedChange={(checked) =>
                                setNewAccount({
                                  ...newAccount,
                                  isRecurringIncome: checked,
                                })
                              }
                            />
                          </div>
                          {newAccount.isRecurringIncome && (
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="recurringAmount"
                                className="text-right"
                              >
                                {t('income.form.monthlyAmount.label')}
                              </Label>
                              <Input
                                id="recurringAmount"
                                type="number"
                                value={newAccount.recurringAmount}
                                onChange={(e) =>
                                  setNewAccount({
                                    ...newAccount,
                                    recurringAmount: e.target.value,
                                  })
                                }
                                className="col-span-3"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <Button onClick={handleAddAccount}>{t('income.dialogs.addAccount.button')}</Button>
                  </DialogContent>
                </Dialog>
              </div>
              <ToastContainer position="top-center" />
              <Dialog
                open={isAddAmountDialogOpen}
                onOpenChange={setIsAddAmountDialogOpen}
              >
                <DialogContent className="overlay-bubble bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-xl">
                  <DialogHeader>
                    <DialogTitle>{t('income.dialogs.addAmount.title')}</DialogTitle>
                  </DialogHeader>

                  <p className="text-sm text-muted-foreground dark:text-gray-300">
                    {t('income.dialogs.addAmount.description')}
                  </p>

                  <Input
                    type="number"
                    placeholder={t('income.dialogs.addAmount.placeholder')}
                    value={additionalAmount}
                    onChange={(e) => {
                      setAdditionalAmount(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    className={`mt-2 ${
                      errorMessage ? "border border-red-500" : ""
                    }`}
                  />

                  {errorMessage && (
                    <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
                  )}

                  <Button className="mt-4" onClick={handleConfirmAddAmount}>
                    {t('income.dialogs.addAmount.add')}
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}