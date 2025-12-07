import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  targetLanguage: string;
  nativeLanguage: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  speakingSpeed: number;
  voicePreference: string;
  storeTranscripts: boolean;
}

interface UserStore {
  preferences: UserPreferences;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  targetLanguage: 'en',
  nativeLanguage: 'es',
  level: 'beginner',
  speakingSpeed: 1.0,
  voicePreference: 'default',
  storeTranscripts: true,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      setPreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),
      resetPreferences: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: 'user-preferences',
    }
  )
);
