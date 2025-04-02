import React, { useState, useEffect, useRef } from 'react';
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
  Info
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const RecentTransactions = ({ 
  transactions, 
  selectedTransactionType, 
  setSelectedTransactionType 
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
  
  // Determine items per page based on screen size
  const getItemsPerPage = () => {
    if (isMobile) return 3;
    if (isSmallScreen) return 4;
    return 5;
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
  // Generate PDF and download directly (using jsPDF)
const exportToPDF = () => {
  if (filteredTransactions.length === 0) {
    alert("No transactions to export");
    return;
  }
  
  setIsExporting(true);
  
  setTimeout(() => {
    try {
      // Create PDF document with explicit settings
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      doc.setFontSize(18);
      doc.text("Transaction Report", 14, 22);
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })}`, 14, 30);
      
      // Add summary section
      doc.setFontSize(12);
      doc.text("Summary", 14, 40);
      
      const totalIncome = filteredTransactions
        .filter(t => t.isIncome)
        .reduce((sum, t) => sum + parseFloat(t.displayAmount.replace(/[^\d.-]/g, '')), 0);
        
      const totalExpense = filteredTransactions
        .filter(t => !t.isIncome)
        .reduce((sum, t) => sum + parseFloat(t.displayAmount.replace(/[^\d.-]/g, '')), 0);
      
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(amount);
      };
      
      doc.setFontSize(10);
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 48);
      doc.text(`Income Transactions: ${filteredTransactions.filter(t => t.isIncome).length}`, 14, 54);
      doc.text(`Expense Transactions: ${filteredTransactions.filter(t => !t.isIncome).length}`, 14, 60);
      doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 14, 66);
      doc.text(`Total Expenses: ${formatCurrency(totalExpense)}`, 14, 72);
      doc.text(`Net Balance: ${formatCurrency(totalIncome - totalExpense)}`, 14, 78);
      
      // Define the table structure and data for transactions
      const tableColumn = ["Description", "Category", "Amount", "Date", "Type"];
      const tableRows = filteredTransactions.map(t => [
        t.description || '',
        t.category || '',
        t.displayAmount || '',
        new Date(t.date).toLocaleDateString('en-IN'),
        t.isIncome ? 'Income' : 'Expense'
      ]);
      
      // Add transaction table with simpler settings
      doc.setFontSize(12);
      doc.text("Transaction Details", 14, 90);
      
      doc.autoTable({
        startY: 95,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 66, 66] },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      // Footer with simpler implementation
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Force download with explicit blob handling
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = `transaction_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, 100); // Small delay to allow UI to update
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{transaction.description}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-xs">
                            <p>{transaction.description}</p>
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 sm:h-32 text-center">
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
    </Card>
  );
};

export default RecentTransactions;