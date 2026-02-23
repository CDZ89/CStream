import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BetaSettings {
  betaMode: boolean;
  adsRemoved: boolean;
  antiPubEnabled: boolean;
}

interface BetaSettingsState extends BetaSettings {
  setBetaMode: (enabled: boolean) => void;
  setAdsRemoved: (enabled: boolean) => void;
  setAntiPubEnabled: (enabled: boolean) => void;
}

export const useBetaSettings = create<BetaSettingsState>()(
  persist(
    (set) => ({
      betaMode: false,
      adsRemoved: false,
      antiPubEnabled: false,
      setBetaMode: (betaMode) => set({ betaMode }),
      setAdsRemoved: (adsRemoved) => set({ adsRemoved }),
      setAntiPubEnabled: (antiPubEnabled) => set({ antiPubEnabled }),
    }),
    {
      name: 'cstream-beta-settings',
    }
  )
);
