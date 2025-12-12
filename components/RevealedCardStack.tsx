"use client";

import { useState } from "react";
import { Card as CardType } from "@/types/card";
import Card from "./Card";

interface RevealedCardStackProps {
  cards: CardType[];
  onDiscard: (card: CardType) => void;
  onPin: (card: CardType) => void;
  deckTitle?: string;
  onSelect?: (card: CardType) => void; // For trait selection (pin + auto-assign)
  disabled?: boolean; // Disable buttons for trait cards
}

export default function RevealedCardStack({
  cards,
  onDiscard,
  onPin,
  deckTitle,
  onSelect,
  disabled = false,
}: RevealedCardStackProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const getCardInstanceId = (card: CardType, index: number) => {
    return `${card.id}-${index}`;
  };

  const handleCardClick = (card: CardType, index: number) => {
    const cardInstanceId = getCardInstanceId(card, index);
    if (expandedCardId === cardInstanceId) {
      // If already expanded, collapse it
      setExpandedCardId(null);
    } else {
      // Expand this card
      setExpandedCardId(cardInstanceId);
    }
  };

  const handleDiscard = (
    e: React.MouseEvent,
    card: CardType,
    index: number
  ) => {
    e.stopPropagation();
    const cardInstanceId = getCardInstanceId(card, index);
    onDiscard(card);
    // If the discarded card was expanded, collapse
    if (expandedCardId === cardInstanceId) {
      setExpandedCardId(null);
    }
  };

  const handlePin = (e: React.MouseEvent, card: CardType, index: number) => {
    e.stopPropagation();

    // Don't allow pinning if disabled (for Community Traits during player turns, or Individual Traits during community turns)
    if (
      disabled &&
      (deckTitle === "Community Traits" || deckTitle === "Individual Traits")
    ) {
      return;
    }

    const cardInstanceId = getCardInstanceId(card, index);

    // For trait cards, use onSelect (which pins + auto-assigns) if available
    // Otherwise, use regular onPin
    const isTraitCard =
      deckTitle === "Individual Traits" || deckTitle === "Community Traits";
    if (isTraitCard && onSelect) {
      onSelect(card);
    } else {
      onPin(card);
    }

    // If the pinned card was expanded, collapse
    if (expandedCardId === cardInstanceId) {
      setExpandedCardId(null);
    }
  };

  const handleSelect = (e: React.MouseEvent, card: CardType, index: number) => {
    e.stopPropagation();
    const cardInstanceId = getCardInstanceId(card, index);
    if (onSelect) {
      onSelect(card);
    }
    // If the selected card was expanded, collapse
    if (expandedCardId === cardInstanceId) {
      setExpandedCardId(null);
    }
  };

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {cards.map((card, index) => {
        const cardInstanceId = getCardInstanceId(card, index);
        const isExpanded = expandedCardId === cardInstanceId;

        return (
          <div key={cardInstanceId} className="animate-fade-in">
            {isExpanded ? (
              // Expanded view - full card
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden relative">
                {/* Arrow button - positioned in upper right corner */}
                <button
                  onClick={() => setExpandedCardId(null)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors z-10"
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
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex justify-center"
                >
                  <Card card={card} deckTitle={deckTitle} />
                </div>
                <div className="px-4 pb-4 pt-2 flex justify-center">
                  <div className="w-64 max-w-full flex gap-2">
                    {(deckTitle === "Individual Traits" ||
                      deckTitle === "Community Traits") && (
                      <button
                        onClick={(e) => handleSelect(e, card, index)}
                        disabled={disabled}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          disabled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
                        }`}
                        title={
                          disabled
                            ? deckTitle === "Community Traits"
                              ? "Only available during community turns"
                              : "Only available during player turns"
                            : undefined
                        }
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDiscard(e, card, index)}
                      disabled={
                        disabled &&
                        (deckTitle === "Community Traits" ||
                          deckTitle === "Individual Traits")
                      }
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        deckTitle === "Individual Traits" ||
                        deckTitle === "Community Traits"
                          ? "flex-1"
                          : "w-full"
                      } ${
                        disabled &&
                        (deckTitle === "Community Traits" ||
                          deckTitle === "Individual Traits")
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
                          : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
                      }`}
                      title={
                        disabled &&
                        (deckTitle === "Community Traits" ||
                          deckTitle === "Individual Traits")
                          ? deckTitle === "Community Traits"
                            ? "Only available during community turns"
                            : "Only available during player turns"
                          : undefined
                      }
                    >
                      Discard
                    </button>
                  </div>
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
                onClick={() => handleCardClick(card, index)}
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
                    onClick={(e) => handlePin(e, card, index)}
                    disabled={
                      disabled &&
                      (deckTitle === "Community Traits" ||
                        deckTitle === "Individual Traits")
                    }
                    className={`p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${
                      disabled &&
                      (deckTitle === "Community Traits" ||
                        deckTitle === "Individual Traits")
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600"
                    }`}
                    aria-label="Pin card"
                    title={
                      disabled &&
                      (deckTitle === "Community Traits" ||
                        deckTitle === "Individual Traits")
                        ? deckTitle === "Community Traits"
                          ? "Only available during community turns"
                          : "Only available during player turns"
                        : "Pin card"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDiscard(e, card, index)}
                    disabled={
                      disabled &&
                      (deckTitle === "Community Traits" ||
                        deckTitle === "Individual Traits")
                    }
                    className={`p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${
                      disabled &&
                      (deckTitle === "Community Traits" ||
                        deckTitle === "Individual Traits")
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                    }`}
                    aria-label="Discard card"
                    title={
                      disabled &&
                      (deckTitle === "Community Traits" ||
                        deckTitle === "Individual Traits")
                        ? deckTitle === "Community Traits"
                          ? "Only available during community turns"
                          : "Only available during player turns"
                        : "Discard card"
                    }
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
