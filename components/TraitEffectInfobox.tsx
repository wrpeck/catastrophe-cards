"use client";

import { Card as CardType } from "@/types/card";
import { useEffect, useRef } from "react";

interface TraitEffectInfoboxProps {
  traitName: string;
  traitCard: CardType | null;
  position: { top: number; left: number };
  onClose: () => void;
}

export default function TraitEffectInfobox({
  traitName,
  traitCard,
  position,
  onClose,
}: TraitEffectInfoboxProps) {
  const infoboxRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        infoboxRef.current &&
        !infoboxRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Add event listener after a short delay to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Adjust position to keep infobox in viewport
  useEffect(() => {
    if (infoboxRef.current) {
      const rect = infoboxRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedLeft = position.left;
      let adjustedTop = position.top;

      // Adjust horizontal position if too far right
      if (rect.right > viewportWidth - 10) {
        adjustedLeft = viewportWidth - rect.width - 10;
      }
      // Adjust horizontal position if too far left
      if (rect.left < 10) {
        adjustedLeft = 10;
      }

      // Adjust vertical position if too far bottom
      if (rect.bottom > viewportHeight - 10) {
        adjustedTop = viewportHeight - rect.height - 10;
      }
      // Adjust vertical position if too far top
      if (rect.top < 10) {
        adjustedTop = 10;
      }

      if (adjustedLeft !== position.left || adjustedTop !== position.top) {
        infoboxRef.current.style.left = `${adjustedLeft}px`;
        infoboxRef.current.style.top = `${adjustedTop}px`;
      }
    }
  }, [position]);

  if (!traitCard) {
    return null;
  }

  return (
    <div
      ref={infoboxRef}
      className="fixed z-[200] bg-white rounded-lg shadow-2xl border-2 border-gray-200 max-w-xs w-full overflow-hidden animate-fade-in pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Header section with subtle background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-900 leading-tight">
            {traitCard.displayName}
          </h3>
        </div>
      </div>

      {/* Content section */}
      <div className="px-4 py-3">
        {traitCard.effect && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Effect
            </div>
            <p className="text-sm text-gray-900 leading-relaxed font-medium">
              {traitCard.effect}
            </p>
          </div>
        )}
      </div>

      {/* Small arrow pointing to badge */}
      <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l-2 border-t-2 border-gray-200 transform rotate-45"></div>
    </div>
  );
}
