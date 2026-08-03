import { create } from 'zustand';
import { AppSettings, UserProfile } from '../types';
import { DUMMY_SETTINGS, DUMMY_USER } from '../data/dummy';
import { storage } from '../services/storage';

interface SettingsStore {
  settings: AppSettings;
  user: UserProfile;
  isOnboarded: boolean;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetApp: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DUMMY_SETTINGS,
  user: DUMMY_USER,
  isOnboarded: false,
  isLoaded: false,

  loadSettings: async () => {
    const [storedSettings, storedUser, onboarded] = await Promise.all([
      storage.settings.get(),
      storage.user.get(),
      storage.onboarded.get(),
    ]);

    set({
      settings: storedSettings ? (storedSettings as AppSettings) : DUMMY_SETTINGS,
      user: storedUser ? (storedUser as UserProfile) : DUMMY_USER,
      isOnboarded: onboarded ?? false,
      isLoaded: true,
    });
  },

  updateSettings: async (updates) => {
    const next = { ...get().settings, ...updates };
    set({ settings: next });
    await storage.settings.set(next);
  },

  updateUser: async (updates) => {
    const next = { ...get().user, ...updates };
    set({ user: next });
    await storage.user.set(next);
  },

  completeOnboarding: async () => {
    set({ isOnboarded: true });
    await storage.onboarded.set(true);
  },

  resetApp: async () => {
    await storage.clearAll();
    set({
      settings: DUMMY_SETTINGS,
      user: DUMMY_USER,
      isOnboarded: false,
    });
  },
}));
