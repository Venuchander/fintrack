// ExpensePage.jsx
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { auth } from "./lib/firebase"
import { addExpense } from "./lib/userService"
import { Calendar } from "../components/components/ui/calendar"
import { Button } from "../components/components/ui/button"
import { format } from "date-fns"
import ProfileButton from './profile'
import Sidebar from './Sidebar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/components/ui/select"
import { Input } from "../components/components/ui/input"
import { Textarea } from "../components/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "../components/components/ui/radio-group"
import { Switch } from "../components/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "../components/components/ui/popover"
import { cn } from "../components/components/lib/utils"
import { CalendarIcon, Upload } from 'lucide-react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  category: z.string({
    required_error: "Please select a category",
  }),
  description: z.string().optional(),
  paymentMethod: z.enum(["cash", "credit", "debit", "digital"], {
    required_error: "Please select a payment method",
  }),
  receipt: z.string().optional(),
  isRecurring: z.boolean().default(false),
})

function AddExpense() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { isRecurring: false },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUser(user);
      else navigate("/login");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  async function onSubmit(values) {
    try {
      if (!user) return;

      // Convert File object to base64 if receipt exists
      let receiptData = null;
      if (values.receipt instanceof File) {
        receiptData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(values.receipt);
        });
      }

      const expenseData = {
        ...values,
        receipt: receiptData,
        amount: parseFloat(values.amount),
        date: values.date.toISOString(),
      };

      await addExpense(user.uid, expenseData);
      form.reset();
      // Optionally show success message or redirect
    } catch (error) {
      console.error("Error adding expense:", error);
      // Handle error (show error message to user)
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="text-xl font-semibold">Loading...</div>
    </div>
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
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
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h2 className="text-2xl font-semibold text-gray-900">Add Expense</h2>
              <ProfileButton
                user={user}
                onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onLogout={() => auth.signOut()}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
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
                                <span className="absolute left-3 top-2.5">$</span>
                                <Input placeholder="0.00" className="pl-6" {...field} />
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
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-wrap gap-4"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="cash" />
                                </FormControl>
                                <FormLabel className="font-normal">Cash</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="credit" />
                                </FormControl>
                                <FormLabel className="font-normal">Credit Card</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="debit" />
                                </FormControl>
                                <FormLabel className="font-normal">Debit Card</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="digital" />
                                </FormControl>
                                <FormLabel className="font-normal">Digital Wallet</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receipt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attach Receipt</FormLabel>
                          <FormControl>
                            <div
                              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault()
                                const file = e.dataTransfer.files?.[0]
                                if (file) field.onChange(file)
                              }}
                            >
                              <Input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept="image/png,image/jpeg"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) field.onChange(file)
                                }}
                              />
                              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <div className="text-sm text-gray-600">
                                <span className="text-blue-600">Upload a file</span> or drag and drop
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                PNG, JPG up to 10MB
                              </div>
                              {field.value && (
                                <div className="mt-2 text-sm text-green-600">
                                  Selected: {field.value instanceof File ? field.value.name : field.value}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isRecurring"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>Recurring Expense</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-4">
                      <Button variant="outline" type="button">Cancel</Button>
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
  )
}

export default AddExpense
