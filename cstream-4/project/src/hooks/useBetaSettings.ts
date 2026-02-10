import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BetaSettings {
  betaMode: boolean;
  adsRemoved: boolean;
}

interface BetaSettingsState extends BetaSettings {
  setBetaMode: (enabled: boolean) => void;
  setAdsRemoved: (enabled: boolean) => void;
}

export const useBetaSettings = create<BetaSettingsState>()(
  persist(
    (set) => ({
      betaMode: false,
      adsRemoved: false,
      setBetaMode: (betaMode) => set({ betaMode }),
      setAdsRemoved: (adsRemoved) => set({ adsRemoved }),
    }),
    {
      name: 'cstream-beta-settings',
    }
  )
);
