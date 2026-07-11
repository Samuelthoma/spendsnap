import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AppState {
  apiKey: string;
  isDarkMode: boolean;
  setApiKey: (key: string) => void;
  toggleDarkMode: () => void;
  clearData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      apiKey: '',
      isDarkMode: false,
      setApiKey: (key) => set({ apiKey: key }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      clearData: () => set({ apiKey: '', isDarkMode: false }),
    }),
    {
      name: 'spendsnap-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);