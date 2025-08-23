// 2025-01-27: Creating UI store for Phase 2 React frontend

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Sidebar
  sidebarOpen: boolean;
  
  // Mobile menu
  mobileMenuOpen: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Loading states
  globalLoading: boolean;
  
  // Modal states
  activeModal: string | null;
  modalData: any;
  
  // Toast settings
  toastPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  toastDuration: number;
}

interface UIActions {
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  
  // Sidebar actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Mobile menu actions
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  
  // Modal actions
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  
  // Toast actions
  setToastPosition: (position: UIState['toastPosition']) => void;
  setToastDuration: (duration: number) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      sidebarOpen: true,
      mobileMenuOpen: false,
      notifications: [],
      globalLoading: false,
      activeModal: null,
      modalData: null,
      toastPosition: 'top-right',
      toastDuration: 4000,

      // Theme actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // Sidebar actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      toggleSidebar: () => {
        const { sidebarOpen } = get();
        set({ sidebarOpen: !sidebarOpen });
      },

      // Mobile menu actions
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      
      toggleMobileMenu: () => {
        const { mobileMenuOpen } = get();
        set({ mobileMenuOpen: !mobileMenuOpen });
      },

      // Notification actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only last 50
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      clearNotifications: () => set({ notifications: [] }),

      // Loading actions
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // Modal actions
      openModal: (modalId, data) => set({ activeModal: modalId, modalData: data }),
      
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Toast actions
      setToastPosition: (position) => set({ toastPosition: position }),
      
      setToastDuration: (duration) => set({ toastDuration: duration }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        toastPosition: state.toastPosition,
        toastDuration: state.toastDuration,
      }),
    }
  )
);

// Hook for using UI store
export const useUI = () => useUIStore();

// Provider component for React context compatibility
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
