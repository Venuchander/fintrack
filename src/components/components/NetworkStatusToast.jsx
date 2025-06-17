import { useEffect } from 'react';
import { toast } from 'react-toastify';

const NetworkStatusToast = () => {
  useEffect(() => {
    const showOfflineToast = () => {
      toast.error("You're offline. Please check your connection.", {
        position: "top-center",
        autoClose: false,
        toastId: 'offline-toast',
      });
    };

    const hideOfflineToast = () => {
      toast.dismiss('offline-toast');
      toast.success("You're back online!", {
        position: "top-center",
        autoClose: 3000,
      });
    };

    // Initial check
    if (!navigator.onLine) {
      showOfflineToast();
    }

    // Add event listeners
    window.addEventListener('offline', showOfflineToast);
    window.addEventListener('online', hideOfflineToast);

    // Cleanup
    return () => {
      window.removeEventListener('offline', showOfflineToast);
      window.removeEventListener('online', hideOfflineToast);
    };
  }, []);

  return null;
};

export default NetworkStatusToast;
