import { create } from 'zustand';

interface CurrencyState {
  selectedCurrency: string | null; // null = auto-detect from timezone
  setCurrency: (code: string | null) => void;
  hydrate: () => void;
  syncFromUser: (preferredCurrency?: string | null) => void;
}

const STORAGE_KEY = 'journey-stay-currency';

export const useCurrencyStore = create<CurrencyState>((set) => ({
  selectedCurrency: null,

  setCurrency: (code) => {
    if (typeof window !== 'undefined') {
      if (code) {
        localStorage.setItem(STORAGE_KEY, code);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    set({ selectedCurrency: code });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    set({ selectedCurrency: stored ?? null });
  },

  syncFromUser: (preferredCurrency) => {
    if (!preferredCurrency) return;
    const current = localStorage.getItem(STORAGE_KEY);
    // Only sync if user hasn't manually overridden
    if (!current) {
      localStorage.setItem(STORAGE_KEY, preferredCurrency);
      set({ selectedCurrency: preferredCurrency });
    }
  },
}));
