import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Disable/enable body scroll when sidebar opens/closes
  useEffect(() => {
    if (isSidebarOpen) {
      // Store original overflow values
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      
      // Disable scroll on both body and html
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Cleanup function to restore original overflow
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    } else {
      // Restore scroll when sidebar is closed
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }, [isSidebarOpen]);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <SidebarContext.Provider 
      value={{ 
        isSidebarOpen, 
        openSidebar, 
        closeSidebar, 
        toggleSidebar,
        setIsSidebarOpen 
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
