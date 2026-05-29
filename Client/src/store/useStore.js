import { create } from "zustand";
import { currentShamsiYear } from "@/lib/afghan-date";
import authService from "@/services/auth.service";

export const useStore = create((set, get) => ({
  // Auth state
  isAuthenticated: authService.isAuthenticated(),
  user: authService.getCurrentUser(),
  isLoading: false,
  error: null,

  // Auth actions
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.login(credentials);
      set({ 
        isAuthenticated: true, 
        user: result.user,
        isLoading: false,
        error: null,
      });
      return result;
    } catch (error) {
      set({ 
        isAuthenticated: false, 
        user: null,
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register(data);
      set({ 
        isAuthenticated: true, 
        user: result.user,
        isLoading: false,
        error: null,
      });
      return result;
    } catch (error) {
      set({ 
        isAuthenticated: false, 
        user: null,
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logout();
      set({ 
        isAuthenticated: false, 
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Still clear auth state even if API call fails
      set({ 
        isAuthenticated: false, 
        user: null,
        isLoading: false,
        error: error.message,
      });
    }
  },

  verifyAuth: async () => {
    if (!authService.isAuthenticated()) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const result = await authService.verify();
      set({ 
        isAuthenticated: true, 
        user: result.user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({ 
        isAuthenticated: false, 
        user: null,
        isLoading: false,
        error: error.message,
      });
    }
  },

  changePassword: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.changePassword(data);
      set({ isLoading: false, error: null });
      return result;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  // UI preferences only — data will come from API
  session: String(currentShamsiYear()),
  setSession: (session) => set({ session }),
  dateMode: "shamsi",
  setDateMode: (dateMode) => set({ dateMode }),
  scope: "All",
  setScope: (scope) => set({ scope }),
  dark: false,
  setDark: (dark) => set({ dark }),
}));
