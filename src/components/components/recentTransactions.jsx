import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { 
  Search, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  FileDown, 
  FileText,
  Info,
  Edit2,
  Trash2,
  Save,
  X,
  Undo,
  AlertTriangle
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useToast } from "../hooks/use-toast";
import { Toaster } from "../ui/toaster";
import jsPDF from 'jspdf';


const RecentTransactions = ({ 
  transactions, 
  selectedTransactionType, 
  setSelectedTransactionType,
  onUpdateTransaction,
  onDeleteTransaction,
  onRestoreTransaction,
  onRefreshTransactions
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [page, setPage] = useState(1);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // New state for edit and delete functionality
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [undoData, setUndoData] = useState(null);
  const [undoTimer, setUndoTimer] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const { toast } = useToast();
  
  // Clear undo timer on component unmount
  useEffect(() => {
    return () => {
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
    };
  }, [undoTimer]);
  
  // Determine items per page based on screen size
  const getItemsPerPage = () => {
    if (isMobile) return 10;
    if (isSmallScreen) return 8;
    return 10;
  };
  
  const itemsPerPage = getItemsPerPage();

  // Handle responsive screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsSmallScreen(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    
    checkScreenSize(); // Initial check
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Get unique categories from transactions
  useEffect(() => {
    if (!transactions?.length) return;
    
    const uniqueCategories = [...new Set(transactions.map(t => t.category))].sort();
    setCategories(uniqueCategories);
  }, [transactions]);

  // Filter transactions based on criteria
  useEffect(() => {
    if (!transactions?.length) {
      setFilteredTransactions([]);
      return;
    }
    
    let filtered = [...transactions];
    
    // Filter by transaction type
    if (selectedTransactionType !== 'all') {
      filtered = filtered.filter(t => 
        (selectedTransactionType === 'income' && t.isIncome) || 
        (selectedTransactionType === 'expense' && !t.isIncome)
      );
    }
    
    // Filter by recent (last 2 days) if not showing all
    if (!showAllTransactions) {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      filtered = filtered.filter(t => new Date(t.date) >= twoDaysAgo);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) || 
        t.category.toLowerCase().includes(query) ||
        (t.isIncome ? 'income' : 'expense').includes(query) ||
        t.displayAmount.toLowerCase().includes(query) ||
        new Date(t.date).toLocaleDateString('en-IN').toLowerCase().includes(query)
      );
    }
    
    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.category));
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setFilteredTransactions(filtered);
    
    // Reset to first page when filters change
    setPage(1);
  }, [transactions, selectedTransactionType, showAllTransactions, searchQuery, selectedCategories]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Handle category selection
  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTransactionType("all");
  };

  // Handle editing transactions
  const startEdit = (transaction, index) => {
    setEditingTransaction(index);
    setEditValues({
      description: transaction.description || '',
      category: transaction.category,
      amount: Math.abs(parseFloat(transaction.displayAmount.replace(/[^\d.-]/g, ''))),
      date: transaction.date,
    });
  };

  const cancelEdit = () => {
    setEditingTransaction(null);
    setEditValues({});
  };

  const saveEdit = async (transaction) => {
    try {
      const updatedTransaction = {
        ...transaction,
        description: editValues.description,
        category: editValues.category,
        amount: parseFloat(editValues.amount),
        date: editValues.date,
      };

      if (onUpdateTransaction) {
        await onUpdateTransaction(updatedTransaction);
        toast({
          title: "Updated",
          description: "Transaction updated successfully.",
          duration: 2000,
        });
      }

      setEditingTransaction(null);
      setEditValues({});
      
      // Refresh transactions if callback provided
      if (onRefreshTransactions) {
        onRefreshTransactions();
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Handle deleting transactions
  const confirmDelete = (transaction, index) => {
    setDeleteConfirmation({ transaction, index });
  };

  const executeDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      const { transaction } = deleteConfirmation;
      
      if (onDeleteTransaction) {
        await onDeleteTransaction(transaction);
      }

      // Set up undo functionality
      setUndoData({
        transaction,
        action: 'delete',
        timestamp: Date.now(),
      });

      // Show undo toast
      setShowUndo(true);

      // Set timer to hide undo after 5 seconds
      const timer = setTimeout(() => {
        setShowUndo(false);
        setUndoData(null);
        setUndoTimer(null);
      }, 5000);
      
      setUndoTimer(timer);

      toast({
        title: "Deleted",
        description: "Transaction deleted. Undo available for 5 seconds.",
        duration: 2000,
      });

      setDeleteConfirmation(null);
      
      // Refresh transactions if callback provided
      if (onRefreshTransactions) {
        onRefreshTransactions();
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // Handle undo functionality
  const handleUndo = async () => {
    if (!undoData) return;

    try {
      if (undoData.action === 'delete') {
        console.log('Attempting to restore transaction:', undoData.transaction);
        
        // Use the restore callback if available, otherwise fall back to update
        if (onRestoreTransaction) {
          await onRestoreTransaction(undoData.transaction);
        } else if (onUpdateTransaction) {
          // Fallback approach - try to re-add as new transaction
          const transactionToRestore = {
            ...undoData.transaction,
            id: undefined, // Remove ID to create new one
            amount: Math.abs(undoData.transaction.amount),
          };
          await onUpdateTransaction(transactionToRestore);
        }
        
        toast({
          title: "Restored",
          description: "Transaction restored successfully.",
          duration: 2000,
        });
      }

      // Clear undo data and timer
      setShowUndo(false);
      setUndoData(null);
      if (undoTimer) {
        clearTimeout(undoTimer);
        setUndoTimer(null);
      }

      // Refresh transactions if callback provided
      if (onRefreshTransactions) {
        onRefreshTransactions();
      }
    } catch (error) {
      console.error("Error undoing action:", error);
      console.error("Transaction data:", undoData.transaction);
      toast({
        title: "Error",
        description: `Failed to restore: ${error.message}`,
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Generate CSV data for Excel export with direct download
  const exportToExcel = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // CSV header
      let csv = "Description,Category,Amount,Date,Type\n";
      
      // Add rows
      filteredTransactions.forEach(t => {
        // Clean amount string - remove currency and signs
        const amount = t.displayAmount.replace(/[+\-₹]/g, '').trim();
        const date = new Date(t.date).toLocaleDateString('en-IN');
        const type = t.isIncome ? 'Income' : 'Expense';
        
        // Properly escape fields with quotes
        const description = `"${(t.description || '').replace(/"/g, '""')}"`;
        const category = `"${(t.category || '').replace(/"/g, '""')}"`;
        
        csv += `${description},${category},${amount},${date},${type}\n`;
      });
      
      // Create and download the file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export transactions. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Generate PDF and download directly (using jsPDF)
  // Replace your existing exportToPDF function with this corrected version

const exportToPDF = () => {
  if (filteredTransactions.length === 0) {
    alert("No transactions to export");
    return;
  }
  
  setIsExporting(true);
  
  try {
    console.log("Starting PDF generation with", filteredTransactions.length, "transactions");
    
    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    console.log("PDF document created");
    
    // Add title
    doc.setFontSize(18);
    doc.text("Transaction Report", 14, 22);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
    
    // Add summary
    doc.setFontSize(12);
    doc.text("Summary", 14, 40);
    
    const totalIncome = filteredTransactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => {
        const amount = parseFloat(t.displayAmount.replace(/[^\d.-]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
        
    const totalExpense = filteredTransactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => {
        const amount = parseFloat(t.displayAmount.replace(/[^\d.-]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    
    console.log("Calculated totals - Income:", totalIncome, "Expense:", totalExpense);
    
    doc.setFontSize(10);
    doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 48);
    doc.text(`Income: Rs ${totalIncome.toLocaleString('en-IN')}`, 14, 54);
    doc.text(`Expenses: Rs ${totalExpense.toLocaleString('en-IN')}`, 14, 60);
    doc.text(`Net: Rs ${(totalIncome - totalExpense).toLocaleString('en-IN')}`, 14, 66);
    
    // Add transactions table
    const tableData = filteredTransactions.map(t => {
      try {
        // Clean and format amount properly
        const rawAmount = parseFloat(t.displayAmount.replace(/[^\d.-]/g, ''));
        const formattedAmount = `Rs ${isNaN(rawAmount) ? '0' : rawAmount.toLocaleString('en-IN')}`;
        
        return [
          (t.description || 'No description').toString().substring(0, 40),
          (t.category || 'Unknown').toString().substring(0, 15),
          formattedAmount,
          new Date(t.date).toLocaleDateString('en-IN'),
          t.isIncome ? 'Income' : 'Expense'
        ];
      } catch (error) {
        console.error("Error processing transaction for PDF:", t, error);
        return [
          'Error processing transaction',
          'Unknown',
          'Rs 0',
          'Invalid Date',
          'Unknown'
        ];
      }
    });
    
    console.log("Table data prepared, rows:", tableData.length);
    
    // Simple table without autoTable plugin
    const startY = 75;
    const lineHeight = 6;
    let currentY = startY;
    
    // Table header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.rect(14, currentY, 180, 8);
    doc.text('Description', 16, currentY + 5);
    doc.text('Category', 71, currentY + 5);
    doc.text('Amount', 101, currentY + 5);
    doc.text('Date', 136, currentY + 5);
    doc.text('Type', 166, currentY + 5);
    currentY += 8;
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    tableData.forEach((row, index) => {
      if (currentY > 270) { // Check if we need a new page
        doc.addPage();
        currentY = 20;
        
        // Repeat header on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.rect(14, currentY, 180, 8);
        doc.text('Description', 16, currentY + 5);
        doc.text('Category', 71, currentY + 5);
        doc.text('Amount', 101, currentY + 5);
        doc.text('Date', 136, currentY + 5);
        doc.text('Type', 166, currentY + 5);
        currentY += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, currentY, 180, lineHeight, 'F');
      }
      
      // Row border
      doc.rect(14, currentY, 180, lineHeight);
      
      // Cell content
      doc.text(row[0], 16, currentY + 4);
      doc.text(row[1], 71, currentY + 4);
      doc.text(row[2], 101, currentY + 4);
      doc.text(row[3], 136, currentY + 4);
      doc.text(row[4], 166, currentY + 4);
      
      currentY += lineHeight;
    });
    
    console.log("Table added successfully");
    
    // Save file
    const fileName = `transaction_report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log("PDF saved successfully:", fileName);
    
    // Show success message
    toast({
      title: "Export Successful",
      description: "PDF report has been downloaded successfully.",
      duration: 3000,
    });
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      transactionCount: filteredTransactions.length,
      sampleTransaction: filteredTransactions[0]
    });
    
    // Show error message
    toast({
      title: "Export Failed",
      description: `Failed to generate PDF: ${error.message}`,
      variant: "destructive",
      duration: 5000,
    });
  } finally {
    setIsExporting(false);
  }
};

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate summary data
  const calculateSummary = () => {
    if (!filteredTransactions.length) return null;
    
    const totalIncome = filteredTransactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + parseFloat(t.displayAmount.replace(/[^\d.-]/g, '')), 0);
      
    const totalExpense = filteredTransactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + parseFloat(t.displayAmount.replace(/[^\d.-]/g, '')), 0);
    
    return {
      totalTransactions: filteredTransactions.length,
      incomeTransactions: filteredTransactions.filter(t => t.isIncome).length,
      expenseTransactions: filteredTransactions.filter(t => !t.isIncome).length,
      totalIncome: formatCurrency(totalIncome),
      totalExpense: formatCurrency(totalExpense),
      netBalance: formatCurrency(totalIncome - totalExpense)
    };
  };

  const summary = calculateSummary();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col space-y-3 sm:space-y-4 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg sm:text-xl">
            {showAllTransactions ? "All Transactions" : "Recent Transactions"}
            {selectedCategories.length > 0 && (
              <Badge variant="outline" className="ml-2 font-normal text-xs">
                {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            {selectedTransactionType !== 'all' && (
              <Badge variant={selectedTransactionType === 'income' ? 'success' : 'destructive'} className="capitalize">
                {selectedTransactionType}
              </Badge>
            )}
            
            {showAllTransactions && filteredTransactions.length > 0 && selectedCategories.length === 0 && selectedTransactionType === 'all' && !searchQuery && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                Reset filters
              </Button>
            )}
          </div>
        </div>
        
        {showAllTransactions && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Popover open={showCategoryFilter} onOpenChange={setShowCategoryFilter}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    {selectedCategories.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedCategories.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" side="bottom">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Filter by Category</h4>
                      {selectedCategories.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedCategories([])}
                          className="h-8 px-2 text-xs"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <div className="flex items-center space-x-2" key={category}>
                            <Checkbox
                              id={`category-${category}`}
                              checked={selectedCategories.includes(category)}
                              onCheckedChange={() => toggleCategory(category)}
                            />
                            <Label 
                              htmlFor={`category-${category}`} 
                              className="truncate cursor-pointer"
                            >
                              {category}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">No categories available</div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none"
                    disabled={filteredTransactions.length === 0 || isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" side="bottom">
                  <div className="p-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start" 
                      onClick={exportToPDF}
                      disabled={filteredTransactions.length === 0 || isExporting}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export as PDF
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start" 
                      onClick={exportToExcel}
                      disabled={filteredTransactions.length === 0 || isExporting}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Export as Excel
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Select 
                value={selectedTransactionType}
                onValueChange={setSelectedTransactionType}
              >
                <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px]">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Show summary data when available */}
        {summary && showAllTransactions && filteredTransactions.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2 bg-muted/30 p-2 sm:p-3 rounded-md sm:grid-cols-3 lg:grid-cols-6">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Transactions</span>
              <span className="font-medium">{summary.totalTransactions}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Income</span>
              <span className="font-medium text-green-600">{summary.incomeTransactions}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Expenses</span>
              <span className="font-medium text-red-600">{summary.expenseTransactions}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total Income</span>
              <span className="font-medium text-green-600">{summary.totalIncome}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total Expenses</span>
              <span className="font-medium text-red-600">{summary.totalExpense}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Net Balance</span>
              <span className="font-medium">{summary.netBalance}</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3 sm:w-auto">Description</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction, index) => (
                  <TableRow key={transaction.id || index}>
                    {editingTransaction === index ? (
                      // Edit mode
                      <>
                        <TableCell className="p-2">
                          <Input
                            value={editValues.description}
                            onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Description"
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell p-2">
                          <Select
                            value={editValues.category}
                            onValueChange={(value) => setEditValues(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm">₹</span>
                            <Input
                              type="number"
                              value={editValues.amount}
                              onChange={(e) => setEditValues(prev => ({ ...prev, amount: e.target.value }))}
                              className="h-8 pl-6 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell p-2">
                          <Input
                            type="date"
                            value={editValues.date ? new Date(editValues.date).toISOString().split('T')[0] : ''}
                            onChange={(e) => setEditValues(prev => ({ ...prev, date: new Date(e.target.value).toISOString() }))}
                            className="h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Badge 
                            variant={transaction.isIncome ? "success" : "destructive"} 
                            className="rounded-md text-xs"
                          >
                            {transaction.isIncome ? 'Income' : 'Expense'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => saveEdit(transaction)}
                              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={cancelEdit}
                              className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      // View mode
                      <>
                        <TableCell className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">{transaction.description && transaction.description.trim() !== '' ? transaction.description : 'No description added'}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="start" className="max-w-xs">
                                <p>{transaction.description && transaction.description.trim() !== '' ? transaction.description : 'No description added'}</p>
                                {/* Show hidden info on mobile */}
                                <div className="block sm:hidden mt-1 text-xs">
                                  <p>Category: {transaction.category}</p>
                                  <p>Date: {new Date(transaction.date).toLocaleDateString('en-IN')}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[120px] truncate">{transaction.category}</TableCell>
                        <TableCell 
                          className={transaction.isIncome ? 'text-green-600 whitespace-nowrap font-medium' : 'text-red-600 whitespace-nowrap font-medium'}
                        >
                          {transaction.displayAmount}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell whitespace-nowrap">
                          {new Date(transaction.date).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={transaction.isIncome ? "success" : "destructive"} 
                            className="rounded-md text-xs sm:text-sm"
                          >
                            {transaction.isIncome ? 'Income' : 'Expense'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="flex justify-end gap-1">
                            {!transaction.isIncome && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => startEdit(transaction, index)}
                                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit transaction</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => confirmDelete(transaction, index)}
                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete transaction</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            {transaction.isIncome && (
                              <span className="text-xs text-muted-foreground px-2">
                                Income items cannot be edited
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 sm:h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-1 p-4">
                        <Info className="h-8 w-8 text-muted-foreground/60" />
                        <p className="text-lg font-medium">No transactions found</p>
                        {showAllTransactions && (searchQuery || selectedCategories.length > 0 || selectedTransactionType !== 'all') && (
                          <p className="text-sm text-muted-foreground">Try changing your search or filter criteria</p>
                        )}
                        {!showAllTransactions && (
                          <p className="text-sm text-muted-foreground">No recent transactions in the last 2 days</p>
                        )}
                        {showAllTransactions && (searchQuery || selectedCategories.length > 0 || selectedTransactionType !== 'all') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearFilters} 
                            className="mt-2"
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
      
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-6">
          <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-1 mt-3 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              1
            </Button>
          
          {page > 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              className="h-8 w-8 p-0"
            >
              {page - 1}
            </Button>
          )}
          
          {page !== 1 && page !== totalPages && (
            <Button
              variant="default"
              size="sm"
              className="h-8 w-8 p-0"
            >
              {page}
            </Button>
          )}
          
          {page < totalPages - 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              className="h-8 w-8 p-0"
            >
              {page + 1}
            </Button>
          )}
          
          {totalPages > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="h-8 w-8 p-0"
            >
              {totalPages}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowAllTransactions(!showAllTransactions);
            setPage(1);
            clearFilters();
          }}
          className="flex-1 sm:flex-initial text-xs sm:text-sm"
        >
          {showAllTransactions ? "Recent Only" : "View All"}
        </Button>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </CardFooter>
    
    {/* Delete Confirmation Dialog */}
    <Dialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transaction? This action cannot be undone directly, but you&apos;ll have 5 seconds to undo after deletion.
          </DialogDescription>
        </DialogHeader>
        {deleteConfirmation && (
          <div className="py-4">
            <div className="space-y-2 text-sm">
              <p><strong>Description:</strong> {deleteConfirmation.transaction.description || 'No description'}</p>
              <p><strong>Category:</strong> {deleteConfirmation.transaction.category}</p>
              <p><strong>Amount:</strong> {deleteConfirmation.transaction.displayAmount}</p>
              <p><strong>Date:</strong> {new Date(deleteConfirmation.transaction.date).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={cancelDelete}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={executeDelete}>
            Delete Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Undo Toast */}
    {showUndo && undoData && (
      <div className="fixed top-16 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto sm:w-auto z-50 animate-in slide-in-from-top-2 duration-300">
        <Card className="border border-orange-200 bg-orange-50 shadow-lg max-w-sm mx-auto sm:mx-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-orange-900 truncate">
                  Transaction deleted
                </p>
                <p className="text-xs text-orange-700 hidden sm:block">
                  Click undo to restore the transaction
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="bg-white border-orange-300 text-orange-900 hover:bg-orange-100 text-xs px-2 py-1 h-7 sm:h-8 sm:px-3 sm:py-2"
              >
                <Undo className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Undo</span>
              </Button>
            </div>
            <div className="mt-2 w-full bg-orange-200 rounded-full h-0.5 sm:h-1">
              <div 
                className="bg-orange-500 h-0.5 sm:h-1 rounded-full animate-pulse"
                style={{ width: '100%' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )}
    <Toaster />
    </Card>
  );
};

export default RecentTransactions;