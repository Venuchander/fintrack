// src/components/ui/FAB.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const FAB = () => {
  const location = useLocation();
  const hideOnRoutes = ['/login', '/signup', '/phone-number'];
  if (hideOnRoutes.includes(location.pathname)) return null;

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const fabRef = useRef(null);

  const handleNavigate = (type) => {
    if (type === 'income') navigate('/income');
    else navigate('/expense');
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={fabRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
    >
      {/* Animate dropdown buttons */}
      <div
      className={`flex flex-col items-end gap-2 transition-all duration-150 ease-out ${
  open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
}`}
      >
        <button
          onClick={() => handleNavigate('income')}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition-transform duration-200"
        >
          <ArrowUpRight className="w-4 h-4" />
          Add Income
        </button>
        <button
          onClick={() => handleNavigate('expense')}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition-transform duration-200"
        >
          <ArrowDownRight className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transform transition duration-200"
        title="Add Transaction"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default FAB;
