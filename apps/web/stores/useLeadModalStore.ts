"use client";

import { create } from "zustand";

type LeadModalState = {
  isOpen: boolean;
  listingId?: string;
  listingAddress?: string;
  open: (payload?: { listingId?: string; listingAddress?: string }) => void;
  close: () => void;
};

export const useLeadModalStore = create<LeadModalState>((set) => ({
  isOpen: false,
  listingId: undefined,
  listingAddress: undefined,
  open: (payload) =>
    set({
      isOpen: true,
      listingId: payload?.listingId,
      listingAddress: payload?.listingAddress,
    }),
  close: () => set({ isOpen: false, listingId: undefined, listingAddress: undefined }),
}));
