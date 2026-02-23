import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BetaSettings {
  betaMode: boolean;
  adsRemoved: boolean;
  antiPubBeta: boolean;
}

interface BetaSettingsState extends BetaSettings {
  setBetaMode: (enabled: boolean) => void;
  setAdsRemoved: (enabled: boolean) => void;
  setAntiPubBeta: (enabled: boolean) => void;
}

export const useBetaSettings = create<BetaSettingsState>()(
  persist(
    (set) => ({
      betaMode: false,
      adsRemoved: false,
      antiPubBeta: false,
      setBetaMode: (betaMode) => set({ betaMode }),
      setAdsRemoved: (adsRemoved) => set({ adsRemoved }),
      setAntiPubBeta: (antiPubBeta) => set({ antiPubBeta }),
    }),
    {
      name: 'cstream-beta-settings',
    }
  )
);
