import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchPartyStore {
  enabled: boolean;
  roomCode: string | null;
  isHost: boolean;
  enableAsHost(): void;
  enableAsGuest(code: string): void;
  disable(): void;
}

export const useWatchPartyStore = create<WatchPartyStore>()(
  persist(
    (set) => ({
      enabled: false,
      roomCode: null,
      isHost: false,
      enableAsHost: () => {
        set({
          enabled: true,
          roomCode: Math.floor(1000 + Math.random() * 9000).toString(),
          isHost: true,
        });
      },
      enableAsGuest: (code: string) => {
        set({
          enabled: true,
          roomCode: code,
          isHost: false,
        });
      },
      disable: () => set({ enabled: false, roomCode: null, isHost: false }),
    }),
    { name: "watch-party-storage" }
  )
);
