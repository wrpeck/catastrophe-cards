"use client";

import { useState, useEffect } from "react";
import { Card as CardType } from "@/types/card";
import Card from "./Card";

interface DrawDeckProps {
  title: string;
  dataFile: string;
}

export default function DrawDeck({ title, dataFile }: DrawDeckProps) {
  const [cards, setCards] = useState<CardType[]>([]);
  const [availableCards, setAvailableCards] = useState<CardType[]>([]);
  const [drawnCard, setDrawnCard] = useState<CardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cards from JSON file
  useEffect(() => {
    async function loadCards() {
      try {
        const response = await fetch(dataFile);
        const data: CardType[] = await response.json();
        setCards(data);
        // Initialize available cards pool with duplicates based on quantity
        const initialPool: CardType[] = [];
        data.forEach((card) => {
          for (let i = 0; i < card.quantity; i++) {
            initialPool.push({ ...card });
          }
        });
        setAvailableCards(initialPool);
        setIsLoading(false);
      } catch (error) {
        console.error(`Error loading cards from ${dataFile}:`, error);
        setIsLoading(false);
      }
    }
    loadCards();
  }, [dataFile]);

  const handleDraw = () => {
    if (availableCards.length === 0) return;

    // Randomly select a card from available pool
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const selectedCard = availableCards[randomIndex];

    // Remove the selected card from available pool
    const newAvailableCards = [...availableCards];
    newAvailableCards.splice(randomIndex, 1);
    setAvailableCards(newAvailableCards);

    // Set as drawn card
    setDrawnCard(selectedCard);
  };

  const handleShuffle = () => {
    // Reset available cards pool
    const initialPool: CardType[] = [];
    cards.forEach((card) => {
      for (let i = 0; i < card.quantity; i++) {
        initialPool.push({ ...card });
      }
    });
    setAvailableCards(initialPool);
    setDrawnCard(null);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

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
          disabled={!canDraw}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            canDraw
              ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
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
        <div className="mt-4 animate-fade-in">
          <Card card={drawnCard} />
        </div>
      )}
    </div>
  );
}

