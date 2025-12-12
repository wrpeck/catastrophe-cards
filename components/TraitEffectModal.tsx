"use client";

import { Card as CardType } from "@/types/card";
import { useRef } from "react";

interface TraitEffectModalProps {
  traitName: string;
  traitCard: CardType | null;
  onClose: () => void;
}

export default function TraitEffectModal({
  traitName,
  traitCard,
  onClose,
}: TraitEffectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  if (!traitCard) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-white/50"
        onClick={onClose}
      />

      {/* Minimalist card */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full p-6 animate-fade-in"
      >
        {/* Trait Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {traitCard.displayName}
        </h3>

        {/* Effect Only */}
        {traitCard.effect && (
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-900 leading-relaxed">
              {traitCard.effect}
            </p>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
