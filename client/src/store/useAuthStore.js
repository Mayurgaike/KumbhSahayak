import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // { id, name, role, zoneId, ... }
      token: null,
      isAuthenticated: false,
      
      login: (userData, token) => {
        set({ user: userData, token, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (userData) => {
        set({ user: userData });
      }
    }),
    {
      name: 'auth-storage', // name of item in localStorage
    }
  )
);

export default useAuthStore;
