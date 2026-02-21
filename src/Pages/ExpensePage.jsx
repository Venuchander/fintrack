import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  extractDataFromReceipt,
  generateExpenseDescription,
  parseExpenseFromVoice,
} from "../services/gemini";
import { auth, db } from "./lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { addExpense } from "./lib/userService";
import { Calendar } from "../components/ui/calendar";
import { Button } from "../components/ui/button";
import { format } from "date-fns";
import ProfileButton from "../components/components/profile";
import Sidebar from "../components/components/Sidebar";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { cn } from "../components/lib/utils";
import {
  CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  FileImage,
  Sparkles,
  X,
  Check,
  Mic,
  Square,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { useSidebar } from "../contexts/SidebarContext";

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  category: z.string({
    required_error: "Please select a category",
  }),
  description: z.string().optional(),
  paymentMethod: z
    .string({
      required_error: "Please select a payment method",
    })
    .min(1, "Please select a payment method"),
  bankPaymentType: z.enum(["upi", "debit", "check"]).optional(),
  cardPaymentType: z.string().optional(),
});

function AddExpense() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar();
  const [showSuccess, setShowSuccess] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const { t } = useTranslation();
  // OCR/AI states
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceResult, setVoiceResult] = useState(null);
  const recognitionRef = useRef(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      date: undefined,
      category: "",
      description: "",
      paymentMethod: "",
      bankPaymentType: undefined,
      cardPaymentType: undefined,
    },
  });

  // Toast network status
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

          const banks = accounts
            .filter((account) => account.type === "Bank")
            .map((account) => ({
              ...account,
              id: account.name,
            }));
          const cards = accounts
            .filter((account) => account.type === "Credit")
            .map((account) => ({
              ...account,
              id: account.name,
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

  // Fixed OCR Processing Function
  const processImageWithOCR = async (imageFile) => {
    setIsProcessing(true);

    try {
      // Call the actual Gemini service instead of mock
      const ocrData = await extractDataFromReceipt(imageFile);

      // Auto-fill form with extracted data
      if (ocrData.amount) {
        form.setValue("amount", ocrData.amount.toString());
      }
      if (ocrData.date) {
        form.setValue("date", new Date(ocrData.date));
      }
      if (ocrData.category) {
        // Map Gemini categories to your form categories
        const categoryMap = {
          "Food & Dining": "food",
          Transportation: "transport",
          Shopping: "shopping",
          Entertainment: "entertainment",
          "Bills & Utilities": "utilities",
          Healthcare: "health",
          Travel: "transport",
          Education: "other",
          Business: "other",
          Other: "other",
        };
        const mappedCategory = categoryMap[ocrData.category] || "other";
        form.setValue("category", mappedCategory);
      }

      setOcrResults(ocrData);

      // Show success message
      toast.success(
        `Receipt processed! Extracted ₹${ocrData.amount || "N/A"} from ${ocrData.merchant || "merchant"}`,
      );
    } catch (error) {
      console.error("OCR processing failed:", error);
      toast.error("Failed to process the image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Fixed AI Description Generation with Indian currency context
  const generateAIDescription = async () => {
    const currentAmount = form.getValues("amount");
    const currentCategory = form.getValues("category");

    if (!currentAmount && !currentCategory && !ocrResults) {
      toast.error("Please add some expense details first");
      return;
    }

    setIsGeneratingDescription(true);

    try {
      const merchant = ocrResults?.merchant || "merchant";
      const category = currentCategory || "other";
      const amount = currentAmount || "0";
      const items = ocrResults?.items || [];

      // Call the real Gemini service with Indian currency context
      const generatedDescription = await generateExpenseDescription(
        amount,
        category,
        merchant,
        items,
        "Keep in mind the description should be based on Indian currency rupee and Indian context",
      );

      form.setValue("description", generatedDescription);
      toast.success("AI description generated!");
    } catch (error) {
      console.error("Description generation failed:", error);
      toast.error("Failed to generate description. Please try again.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };
  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedImage(URL.createObjectURL(file));
      processImageWithOCR(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file));
      processImageWithOCR(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedImage(URL.createObjectURL(file));
      processImageWithOCR(file);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setOcrResults(null);
  };

  // Voice recording functions
  const isRecordingRef = useRef(false);

  const startVoiceRecording = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      toast.error(t("expense.voice.notSupported"));
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      setVoiceTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      // "no-speech" fires after silence — just restart if still recording
      if (event.error === "no-speech") {
        return;
      }
      // "aborted" fires when we call .stop() — ignore it
      if (event.error === "aborted") {
        return;
      }
      if (event.error === "not-allowed") {
        toast.error(t("expense.voice.micPermissionDenied"));
      } else if (event.error === "network") {
        toast.error(t("expense.voice.recordingError"));
      } else {
        toast.error(t("expense.voice.recordingError"));
      }
      isRecordingRef.current = false;
      setIsRecording(false);
    };

    recognition.onend = () => {
      // Auto-restart if the user hasn't explicitly stopped
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          // If restart fails, just stop gracefully
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      setVoiceTranscript("");
      setVoiceResult(null);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      toast.error(t("expense.voice.recordingError"));
    }
  };

  const stopVoiceRecording = async () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);

    if (!voiceTranscript.trim()) {
      toast.error(t("expense.voice.noSpeechDetected"));
      return;
    }

    setIsProcessingVoice(true);
    try {
      const availableMethods = [
        ...creditCards.map((c) => c.name),
        ...bankAccounts.map((a) => a.name),
      ];

      const parsed = await parseExpenseFromVoice(
        voiceTranscript.trim(),
        availableMethods,
      );
      setVoiceResult(parsed);

      // Auto-fill the form
      if (parsed.amount) {
        form.setValue("amount", parsed.amount.toString());
      }
      if (parsed.date) {
        form.setValue("date", new Date(parsed.date));
      }
      if (parsed.category) {
        form.setValue("category", parsed.category);
      }
      if (parsed.description) {
        form.setValue("description", parsed.description);
      }
      if (parsed.paymentMethod) {
        const method = parsed.paymentMethod.toLowerCase();
        if (method === "cash") {
          form.setValue("paymentMethod", "cash");
        } else {
          // Try matching to credit cards or bank accounts
          const matchedCard = creditCards.find((c) =>
            c.name.toLowerCase().includes(method),
          );
          const matchedBank = bankAccounts.find(
            (a) =>
              a.name.toLowerCase().includes(method) ||
              (a.bankName && a.bankName.toLowerCase().includes(method)),
          );
          if (matchedCard) {
            form.setValue("paymentMethod", matchedCard.name);
          } else if (matchedBank) {
            form.setValue("paymentMethod", matchedBank.name);
          }
        }
        form.clearErrors("paymentMethod");
      }

      toast.success(t("expense.voice.parsedSuccessfully"));
    } catch (error) {
      console.error("Voice parsing failed:", error);
      toast.error(t("expense.voice.parsingFailed"));
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const clearVoiceData = () => {
    setVoiceTranscript("");
    setVoiceResult(null);
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  async function onSubmit(values) {
    try {
      if (!user) return;

      if (!values.paymentMethod) {
        form.setError("paymentMethod", {
          type: "manual",
          message: "Please select a payment method",
        });
        return;
      }

      const selectedCard = creditCards.find(
        (card) => card.name === values.paymentMethod,
      );
      const selectedBank = bankAccounts.find(
        (account) => account.name === values.paymentMethod,
      );

      const expenseData = {
        amount: parseFloat(values.amount),
        date: values.date.toISOString(),
        category: values.category,
        description: values.description || "",
        paymentMethod: values.paymentMethod,
        paymentType: selectedBank ? values.bankPaymentType : "credit",
        accountType: selectedCard ? "Credit" : selectedBank ? "Bank" : "Cash",
        ocrData: ocrResults || null, // Include OCR data if available
      };

      await addExpense(user.uid, expenseData);

      // Reset form with default values
      form.reset({
        amount: "",
        date: undefined,
        category: "",
        description: "",
        paymentMethod: "",
        bankPaymentType: undefined,
        cardPaymentType: undefined,
      });

      setUploadedImage(null);
      setOcrResults(null);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense. Please try again.");
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex min-h-screen flex-col sm:flex-row">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={closeSidebar}
          />
        )}

        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} user={user} />

        <div className="flex-1 flex flex-col min-h-screen w-full">
          <header className="bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {t("expense.title")}
                </h2>
                <ProfileButton
                  user={user}
                  onMenuToggle={toggleSidebar}
                  onLogout={() => auth.signOut()}
                />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-4 pb-8 sm:pb-6">
            <div className="max-w-2xl mx-auto space-y-4 pb-8 sm:pb-6 w-full">
              {showSuccess && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <Alert variant="success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>{t("expense.success")}</AlertDescription>
                  </Alert>
                </div>
              )}

              <Card className="w-full">
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle>{t("expense.addNewExpense")}</CardTitle>
                  <CardDescription>{t("expense.subtitle")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 sm:space-y-4">
                  {/* Voice Recording Section */}
                  <div className="mb-6 sm:mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                      {t("expense.voice.title")}
                    </label>

                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      {!isRecording &&
                      !voiceTranscript &&
                      !isProcessingVoice ? (
                        <div className="space-y-3">
                          <Mic className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {t("expense.voice.instructions")}
                          </p>
                          <button
                            type="button"
                            onClick={startVoiceRecording}
                            className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-all duration-200 text-sm font-medium shadow-sm"
                          >
                            <Mic className="w-4 h-4 mr-2" />
                            {t("expense.voice.startRecording")}
                          </button>
                        </div>
                      ) : isRecording ? (
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <div className="relative">
                              <div className="animate-ping absolute inset-0 rounded-full bg-red-400 opacity-75"></div>
                              <Mic className="relative h-8 w-8 text-red-500" />
                            </div>
                          </div>
                          <p className="text-red-600 dark:text-red-400 text-sm font-medium animate-pulse">
                            {t("expense.voice.listening")}
                          </p>
                          {voiceTranscript && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm italic px-4">
                              &ldquo;{voiceTranscript}&rdquo;
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={stopVoiceRecording}
                            className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium shadow-sm"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            {t("expense.voice.stopRecording")}
                          </button>
                        </div>
                      ) : isProcessingVoice ? (
                        <div className="flex flex-col items-center space-y-2 py-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {t("expense.voice.processingWithAI")}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                              {t("expense.voice.youSaid")}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                              &ldquo;{voiceTranscript}&rdquo;
                            </p>
                          </div>

                          {voiceResult && (
                            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-center space-x-2 text-green-700 dark:text-green-300 mb-1">
                                <Check className="w-4 h-4" />
                                <span className="font-medium text-sm">
                                  {t("expense.voice.dataExtracted")}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-center space-x-3">
                            <button
                              type="button"
                              onClick={startVoiceRecording}
                              className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors"
                            >
                              <Mic className="w-3.5 h-3.5 mr-1.5" />
                              {t("expense.voice.recordAgain")}
                            </button>
                            <button
                              type="button"
                              onClick={clearVoiceData}
                              className="inline-flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                            >
                              <X className="w-3.5 h-3.5 mr-1.5" />
                              {t("expense.voice.clear")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Receipt Upload Section */}
                  <div className="mb-6 sm:mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                      {t("expense.scanReceipt")}
                    </label>

                    {!uploadedImage ? (
                      <div className="space-y-4">
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                            {t("expense.dragAndDrop")}
                          </p>

                          <div className="flex justify-center space-x-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium shadow-sm"
                            >
                              <FileImage className="w-4 h-4 mr-2" />
                              {t("expense.chooseFile")}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                cameraInputRef.current?.click();
                              }}
                              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium shadow-sm"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              {t("expense.takePhoto")}
                            </button>
                          </div>
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        <input
                          ref={cameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleCameraCapture}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={uploadedImage}
                          alt="Uploaded receipt"
                          className="w-full max-h-48 object-contain rounded-lg border bg-gray-50 dark:bg-gray-800"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {isProcessing && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg flex items-center space-x-2 text-sm">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                              <span>{t("expense.processingWithAI")}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {ocrResults && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                          <Check className="w-4 h-4" />
                          <span className="font-medium text-sm">
                            {t("expense.dataExtractedSuccessfully")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6 sm:space-y-4"
                    >
                      <div className="grid gap-6 sm:gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("expense.form.amount.label")} *
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-medium">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="pl-7 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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
                              <FormLabel>
                                {t("expense.form.date.label")} *
                              </FormLabel>
                              <Popover
                                open={isDatePickerOpen}
                                onOpenChange={setIsDatePickerOpen}
                              >
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground",
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>
                                          {t("expense.form.date.placeholder")}
                                        </span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      field.onChange(date);
                                      setIsDatePickerOpen(false);
                                    }}
                                    disabled={(date) =>
                                      date > new Date() ||
                                      date < new Date("1900-01-01")
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
                            <FormLabel>
                              {t("expense.form.category.label")}
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t(
                                      "expense.form.category.placeholder",
                                    )}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="food">
                                  {t("expense.form.category.options.food")}
                                </SelectItem>
                                <SelectItem value="transport">
                                  {t("expense.form.category.options.transport")}
                                </SelectItem>
                                <SelectItem value="shopping">
                                  {t("expense.form.category.options.shopping")}
                                </SelectItem>
                                <SelectItem value="entertainment">
                                  {t(
                                    "expense.form.category.options.entertainment",
                                  )}
                                </SelectItem>
                                <SelectItem value="health">
                                  {t("expense.form.category.options.health")}
                                </SelectItem>
                                <SelectItem value="other">
                                  {t("expense.form.category.options.other")}
                                </SelectItem>
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
                            <FormLabel>{t("expense.description")}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Textarea
                                  placeholder={t("expense.addDetails")}
                                  className="resize-none pr-20"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={generateAIDescription}
                                  disabled={isGeneratingDescription}
                                  className="absolute bottom-2 right-2 flex items-center px-2 py-1 bg-gray-800 text-white text-xs rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isGeneratingDescription ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  ) : (
                                    <Sparkles className="w-3 h-3 mr-1" />
                                  )}
                                  AI
                                </button>
                              </div>
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
                            <FormLabel>
                              {t("expense.paymentMethod")} *
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  if (
                                    !bankAccounts.some(
                                      (account) => account.name === value,
                                    )
                                  ) {
                                    form.setValue("bankPaymentType", undefined);
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
                                  <FormLabel className="font-normal">
                                    {t("expense.cash")}
                                  </FormLabel>
                                </FormItem>

                                {creditCards.map((card) => (
                                  <FormItem
                                    key={card.id}
                                    className="flex items-center space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <RadioGroupItem value={card.name} />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {card.name}
                                    </FormLabel>
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

                                    <FormLabel className="font-normal">
                                      {account.bankName || account.bankName}
                                    </FormLabel>
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
                        bankAccounts.some(
                          (account) =>
                            account.name === form.watch("paymentMethod"),
                        ) && (
                          <FormField
                            control={form.control}
                            name="bankPaymentType"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>
                                  {t("expense.bankPaymentType")} *
                                </FormLabel>
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
                                      <FormLabel className="font-normal">
                                        {t("expense.upi")}
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="debit" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {t("expense.debitCard")}
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="check" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {t("expense.check")}
                                      </FormLabel>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                      <div className="flex justify-end gap-4 pt-4">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => navigate("/dashboard")}
                        >
                          {t("expense.cancel")}
                        </Button>
                        <Button type="submit">{t("expense.addExpense")}</Button>
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
