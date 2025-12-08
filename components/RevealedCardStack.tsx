"use client";

import { useState } from "react";
import { Card as CardType } from "@/types/card";
import Card from "./Card";

interface RevealedCardStackProps {
  cards: CardType[];
  onDiscard: (card: CardType) => void;
  onPin: (card: CardType) => void;
}

export default function RevealedCardStack({
  cards,
  onDiscard,
  onPin,
}: RevealedCardStackProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const handleCardClick = (card: CardType) => {
    if (expandedCardId === card.id) {
      // If already expanded, collapse it
      setExpandedCardId(null);
    } else {
      // Expand this card
      setExpandedCardId(card.id);
    }
  };

  const handleDiscard = (e: React.MouseEvent, card: CardType) => {
    e.stopPropagation();
    onDiscard(card);
    // If the discarded card was expanded, collapse
    if (expandedCardId === card.id) {
      setExpandedCardId(null);
    }
  };

  const handlePin = (e: React.MouseEvent, card: CardType) => {
    e.stopPropagation();
    onPin(card);
    // If the pinned card was expanded, collapse
    if (expandedCardId === card.id) {
      setExpandedCardId(null);
    }
  };

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {cards.map((card, index) => {
        const isExpanded = expandedCardId === card.id;

        return (
          <div key={`${card.id}-${index}`} className="animate-fade-in">
            {isExpanded ? (
              // Expanded view - full card
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden relative">
                {/* Arrow button - positioned on the right */}
                <button
                  onClick={() => setExpandedCardId(null)}
                  className={`absolute top-2 ${
                    card.isTraitEffect ? "right-20" : "right-2"
                  } p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors z-10`}
                  aria-label="Collapse card"
                  title="Collapse"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                <div onClick={(e) => e.stopPropagation()}>
                  <Card
                    card={card}
                    onPin={() => {
                      handlePin(
                        { stopPropagation: () => {} } as React.MouseEvent,
                        card
                      );
                    }}
                    showPinButton={true}
                  />
                </div>
                <div className="px-4 pb-4 pt-2 flex gap-2">
                  <button
                    onClick={(e) => handleDiscard(e, card)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 active:scale-95 transition-all duration-200"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => setExpandedCardId(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 active:scale-95 transition-all duration-200"
                  >
                    Collapse
                  </button>
                </div>
              </div>
            ) : (
              // Collapsed view - title only
              <div
                className={`${
                  card.type === "good"
                    ? "bg-green-100"
                    : card.type === "bad"
                    ? "bg-red-100"
                    : card.type === "mixed"
                    ? "bg-gradient-to-br from-green-100 to-red-100"
                    : "bg-white"
                } rounded-lg shadow-sm border border-gray-200 px-4 py-3 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all duration-200 flex items-center justify-between group relative`}
                onClick={() => handleCardClick(card)}
              >
                {/* Trait Effect Icon */}
                {card.isTraitEffect && (
                  <div
                    className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 z-10"
                    title={`Trait Effect: ${card.isTraitEffect}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span className="text-xs font-medium whitespace-nowrap">
                      {card.isTraitEffect}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {card.displayName}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {card.effect}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={(e) => handlePin(e, card)}
                    className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Pin card"
                    title="Pin card"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M16 12V4h1a2 2 0 0 0 0-4H7a2 2 0 1 0 0 4h1v8a2 2 0 0 1-2 2H5a2 2 0 0 0 0 4h14a2 2 0 0 0 0-4h-3a2 2 0 0 1-2-2zm-5-3V4h2v5a1 1 0 1 1-2 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDiscard(e, card)}
                    className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Discard card"
                    title="Discard card"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 shrink-0 transition-colors group-hover:text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-xs text-gray-500 mt-2 text-center">
        Click a card to expand, or use the buttons to pin/discard
      </p>
    </div>
  );
}
