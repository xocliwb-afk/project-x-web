"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import LeadForm from "./LeadForm";
import { useLeadModalStore } from "@/stores/useLeadModalStore";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

export default function LeadModalContainer() {
  const { isOpen, listingId, listingAddress, close } = useLeadModalStore();
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [isOpen]);

  useEffect(() => {
    // Close modal on route change to avoid stale context
    close();
  }, [pathname, close]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4"
      onClick={close}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white hover:bg-black/80"
        >
          ✕
        </button>
        <LeadForm
          listingId={listingId}
          listingAddress={listingAddress}
          onSuccess={close}
          onCancel={close}
        />
      </div>
    </div>,
    document.body,
  );
}
