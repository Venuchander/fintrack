// src/components/ui/FAB.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';

const FAB = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const fabRef = useRef(null);
  const { isSidebarOpen } = useSidebar();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && fabRef.current && !fabRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);
  
  const hideOnRoutes = ['/login', '/signup', '/phone-number', '/chatbot'];
  if (hideOnRoutes.includes(location.pathname) || isSidebarOpen) return null;

  const handleNavigate = (type) => {
    if (type === 'income') navigate('/income');
    else navigate('/expense');
    setOpen(false);
  };

  const handleFABClick = (e) => {
    e.stopPropagation();
    setOpen(!open);
  };

  // Determine which buttons to show based on current page
  const isExpensePage = location.pathname === '/expense';
  const isIncomePage = location.pathname === '/income';

  return (
    <div
      ref={fabRef}
      className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2 pointer-events-none"
    >
      {/* Animate dropdown buttons */}
      <div
        className={`flex flex-col items-end gap-2 transition-all duration-300 ease-out ${
          open 
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        {/* Show Add Income button only if NOT on income page */}
        {!isIncomePage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate('income');
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition-transform duration-200"
          >
            <ArrowUpRight className="w-4 h-4" />
            Add Income
          </button>
        )}
        
        {/* Show Add Expense button only if NOT on expense page */}
        {!isExpensePage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate('expense');
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition-transform duration-200"
          >
            <ArrowDownRight className="w-4 h-4" />
            Add Expense
          </button>
        )}
      </div>

      {/* Main FAB */}
      <button
        onClick={handleFABClick}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transform transition duration-200 pointer-events-auto"
        title="Add Transaction"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default FAB;
