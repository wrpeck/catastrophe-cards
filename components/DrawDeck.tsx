"use client";

import { useEffect } from "react";
import { Card as CardType } from "@/types/card";
import Card from "./Card";

interface DrawDeckProps {
  title: string;
  dataFile: string;
  availableCards: CardType[];
  drawnCard: CardType | null;
  onDraw: () => void;
  onShuffle: () => void;
  onCardsLoaded?: (cards: CardType[]) => void;
  lastDrawPlayerName?: string | null;
  lastDrawRound?: number | null;
  disabled?: boolean; // Disable the draw button
}

export default function DrawDeck({
  title,
  dataFile,
  availableCards,
  drawnCard,
  onDraw,
  onShuffle,
  onCardsLoaded,
  lastDrawPlayerName,
  lastDrawRound,
  disabled = false,
}: DrawDeckProps) {
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

  const handleDraw = () => {
    if (availableCards.length === 0) return;
    onDraw();
  };

  const handleShuffle = () => {
    onShuffle();
  };

  const cardCount = availableCards.length;
  const canDraw = cardCount > 0;

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
          onClick={handleDraw}
          disabled={!canDraw || disabled}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            canDraw && !disabled
              ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          title={
            disabled
              ? title === "Community Event"
                ? "Only available during community turns"
                : title === "Wanderer"
                ? "Only available during the Wanderer's turn"
                : "Only available during player turns"
              : undefined
          }
        >
          Draw Card
        </button>
        <button
          onClick={handleShuffle}
          className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Shuffle
        </button>
      </div>

      {drawnCard && (
        <div className="mt-4 animate-fade-in flex flex-col items-center gap-2">
          <Card card={drawnCard} />
          {lastDrawPlayerName && (
            <p className="text-sm text-gray-600">
              Last Draw:{" "}
              <span className="font-semibold">{lastDrawPlayerName}</span>
              {lastDrawRound !== null && lastDrawRound !== undefined && (
                <span className="text-gray-500"> (Round {lastDrawRound})</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
