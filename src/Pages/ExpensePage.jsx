import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "../components/ui/alert";
import { auth, db } from "./lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { addExpense } from "./lib/userService";
import { Calendar } from "../components/ui/calendar";
import { Button } from "../components/ui/button";
import { format } from "date-fns";
import ProfileButton from '../components/components/profile';
import Sidebar from '../components/components/Sidebar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { cn } from "../components/lib/utils";
import { CalendarIcon, CheckCircle2, AlertCircle  } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  category: z.string({
    required_error: "Please select a category",
  }),
  description: z.string().optional(),
  paymentMethod: z.string({
    required_error: "Please select a payment method",
  }).min(1, "Please select a payment method"),
  bankPaymentType: z.enum(["upi", "debit", "check"]).optional(),
  cardPaymentType: z.string().optional(),
});

function AddExpense() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: "",
    },
  });

  //✨ Toast network status
    useEffect(() => {
      const handleOffline = () => {
        toast.error("You're offline. Please check your Internet Connection.", {
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
    }, []);

  useEffect(() => {
    const fetchUserData = async (userId) => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const accounts = userData.accounts || [];

          const banks = accounts.filter(account => account.type === "Bank")
            .map(account => ({
              ...account,
              id: account.name
            }));
          const cards = accounts.filter(account => account.type === "Credit")
            .map(account => ({
              ...account,
              id: account.name
            }));

          setBankAccounts(banks);
          setCreditCards(cards);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        fetchUserData(user.uid);
      } else {
        navigate("/login");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  async function onSubmit(values) {
    try {
      if (!user) return;


      if (!values.paymentMethod) {
        form.setError("paymentMethod", {
          type: "manual",
          message: "Please select a payment method"
        });
        return;
      }

      const selectedCard = creditCards.find(card => card.name === values.paymentMethod);
      const selectedBank = bankAccounts.find(account => account.name === values.paymentMethod);

      const expenseData = {
        amount: parseFloat(values.amount),
        date: values.date.toISOString(),
        category: values.category,
        description: values.description || "",
        paymentMethod: values.paymentMethod,
        paymentType: selectedBank ? values.bankPaymentType : 'credit',
        accountType: selectedCard ? 'Credit' : (selectedBank ? 'Bank' : 'Cash'),
      };

      await addExpense(user.uid, expenseData);
      form.reset();
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex min-h-screen bg-gray-100">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setIsSidebarOpen(false)} />
        )}

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />

        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm flex-shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <h2 className="text-2xl font-semibold text-gray-900">Expense</h2>
                <ProfileButton
                  user={user}
                  onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                  onLogout={() => auth.signOut()}
                />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-2xl mx-auto space-y-4 pb-6">
              {showSuccess && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Expense added successfully!
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Add New Expense</CardTitle>
                  <CardDescription>Track your spending by adding a new expense</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-medium">₹</span>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00" 
                                    className="pl-7" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date *</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="food">Food & Dining</SelectItem>
                                <SelectItem value="transport">Transportation</SelectItem>
                                <SelectItem value="utilities">Utilities</SelectItem>
                                <SelectItem value="shopping">Shopping</SelectItem>
                                <SelectItem value="entertainment">Entertainment</SelectItem>
                                <SelectItem value="health">Healthcare</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add details about this expense"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Payment Method *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  if (!bankAccounts.some(account => account.name === value)) {
                                    form.setValue('bankPaymentType', undefined);
                                  }
                                  // Clear any existing error when a selection is made
                                  form.clearErrors("paymentMethod");
                                }}
                                value={field.value}
                                className="flex flex-col space-y-2"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="cash" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Cash</FormLabel>
                                </FormItem>

                                {creditCards.map((card) => (
                                  <FormItem
                                    key={card.id}
                                    className="flex items-center space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <RadioGroupItem value={card.name} />
                                    </FormControl>
                                    <FormLabel className="font-normal">{card.name}</FormLabel>
                                  </FormItem>
                                ))}

                                {bankAccounts.map((account) => (
                                  <FormItem
                                    key={account.id}
                                    className="flex items-center space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <RadioGroupItem value={account.name} />
                                    </FormControl>
                                    <FormLabel className="font-normal">{account.bankName}</FormLabel>
                                  </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-red-500" />
                            {form.formState.errors.paymentMethod && (
                              <Alert variant="destructive" className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  {form.formState.errors.paymentMethod.message}
                                </AlertDescription>
                              </Alert>
                            )}
                          </FormItem>
                        )}
                      />

                      {form.watch("paymentMethod") && 
                      bankAccounts.some(account => account.name === form.watch("paymentMethod")) && (
                        <FormField
                          control={form.control}
                          name="bankPaymentType"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Bank Payment Type *</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-col space-y-2"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="upi" />
                                    </FormControl>
                                    <FormLabel className="font-normal">UPI</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="debit" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Debit Card</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="check" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Check</FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="flex justify-end gap-4">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => navigate('/dashboard')}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Add Expense</Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <ToastContainer position="top-center" />
    </div>
  );
}

export default AddExpense;