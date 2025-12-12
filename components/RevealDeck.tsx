"use client";

import { useEffect } from "react";
import { Card as CardType } from "@/types/card";
import { Community } from "@/types/gameState";
import RevealedCardStack from "./RevealedCardStack";

interface RevealDeckProps {
  title: string;
  dataFile: string;
  pinnedCards: CardType[];
  availableCards: CardType[];
  revealedCards: CardType[];
  discardedCards: CardType[];
  onPin: (card: CardType) => void;
  onUnpin: (card: CardType) => CardType;
  onReveal: () => void;
  onCardSelect: (card: CardType) => void;
  onShuffle: () => void;
  onAddToDiscardRef?: (ref: (card: CardType) => void) => void;
  onCardsLoaded?: (cards: CardType[]) => void;
  onSelect?: (card: CardType) => void; // For trait selection (pin + auto-assign)
  disabled?: boolean; // Disable buttons for trait cards
  currentTurnIndex?: number; // Current turn index
  turnOrder?: (string | "creation")[]; // Turn order array
  communities?: Community[]; // Communities array
  playerResources?: { name: string; resources: number }[]; // Player resources
  turnAssist?: boolean; // Turn Assist setting
  isCreationTurn?: boolean; // Whether current turn is Creation phase
}

export default function RevealDeck({
  title,
  dataFile,
  pinnedCards,
  availableCards,
  revealedCards,
  discardedCards,
  onPin,
  onUnpin,
  onReveal,
  onCardSelect,
  onShuffle,
  onAddToDiscardRef,
  onCardsLoaded,
  onSelect,
  disabled = false,
  currentTurnIndex,
  turnOrder,
  communities,
  playerResources,
  turnAssist,
  isCreationTurn,
}: RevealDeckProps) {
  // Expose addToDiscard function to parent
  useEffect(() => {
    if (onAddToDiscardRef) {
      onAddToDiscardRef((card: CardType) => {
        // This will be handled by parent state management
      });
    }
  }, [onAddToDiscardRef]);

  // Load cards from JSON file and notify parent
  useEffect(() => {
    async function loadCards() {
      try {
        const response = await fetch(dataFile);
        const data: CardType[] = await response.json();
        if (onCardsLoaded) {
          onCardsLoaded(data);
        }
      } catch (error) {
        console.error(`Error loading cards from ${dataFile}:`, error);
      }
    }
    loadCards();
  }, [dataFile, onCardsLoaded]);

  const handlePin = (cardToPin: CardType) => {
    onPin(cardToPin);
  };

  const cardCount = availableCards.length;
  const canReveal = cardCount >= 3;

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-300">
          {cardCount} cards
        </span>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={onReveal}
          disabled={!canReveal}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            canReveal
              ? "bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-md hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {revealedCards.length > 0
            ? "Discard All & Reveal New"
            : "Reveal 3 Cards"}
        </button>
        <button
          onClick={onShuffle}
          className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Shuffle
        </button>
      </div>

      {revealedCards.length > 0 && (
        <div className="mt-4">
          <RevealedCardStack
            cards={revealedCards}
            onDiscard={onCardSelect}
            onPin={handlePin}
            deckTitle={title}
            onSelect={onSelect}
            disabled={disabled}
            currentTurnIndex={currentTurnIndex}
            turnOrder={turnOrder}
            communities={communities}
            playerResources={playerResources}
            turnAssist={turnAssist}
            isCreationTurn={isCreationTurn}
          />
        </div>
      )}
    </div>
  );
}
