"use client";

import { useState, useEffect } from "react";
import { Card as CardType } from "@/types/card";
import Card from "./Card";
import RevealedCardStack from "./RevealedCardStack";

interface RevealDeckProps {
  title: string;
  dataFile: string;
  pinnedCards: CardType[];
  onPin: (card: CardType) => void;
  onUnpin: (card: CardType) => CardType;
  onAddToDiscardRef?: (ref: (card: CardType) => void) => void;
}

export default function RevealDeck({
  title,
  dataFile,
  pinnedCards,
  onPin,
  onUnpin,
  onAddToDiscardRef,
}: RevealDeckProps) {
  const [cards, setCards] = useState<CardType[]>([]);
  const [availableCards, setAvailableCards] = useState<CardType[]>([]);
  const [revealedCards, setRevealedCards] = useState<CardType[]>([]);
  const [discardedCards, setDiscardedCards] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Expose addToDiscard function to parent
  useEffect(() => {
    if (onAddToDiscardRef) {
      onAddToDiscardRef((card: CardType) => {
        setDiscardedCards((prev) => [...prev, card]);
      });
    }
  }, [onAddToDiscardRef]);

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

  const getRandomCards = (
    count: number,
    pool: CardType[]
  ): { selected: CardType[]; remaining: CardType[] } => {
    if (pool.length === 0) return { selected: [], remaining: [] };
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    const remaining = shuffled.slice(Math.min(count, shuffled.length));
    return { selected, remaining };
  };

  const handleReveal = () => {
    let currentAvailableCards = [...availableCards];

    // If cards are already revealed, discard all and add them to discard pile
    if (revealedCards.length > 0) {
      // Add revealed cards to discard pile
      setDiscardedCards([...discardedCards, ...revealedCards]);

      // Remove revealed cards from available pool (one instance of each)
      revealedCards.forEach((revealedCard) => {
        const index = currentAvailableCards.findIndex(
          (card) => card.id === revealedCard.id
        );
        if (index !== -1) {
          currentAvailableCards.splice(index, 1);
        }
      });
    }

    // Reveal 3 new random cards from current available pool
    const { selected: newRevealedCards, remaining: remainingCards } =
      getRandomCards(3, currentAvailableCards);

    setRevealedCards(newRevealedCards);
    setAvailableCards(remainingCards);
  };

  const handleCardSelect = (selectedCard: CardType) => {
    // Remove first matching card from revealed cards
    const cardToRemoveIndex = revealedCards.findIndex(
      (card) => card.id === selectedCard.id
    );
    const newRevealedCards = revealedCards.filter(
      (_, index) => index !== cardToRemoveIndex
    );

    // Add discarded card to discard pile
    setDiscardedCards([...discardedCards, selectedCard]);

    // Remove one instance of selected card from available pool
    const newAvailableCards = [...availableCards];
    const cardIndex = newAvailableCards.findIndex(
      (card) => card.id === selectedCard.id
    );
    if (cardIndex !== -1) {
      newAvailableCards.splice(cardIndex, 1);
    }

    // Replace with a new random card if available
    if (newAvailableCards.length > 0 && newRevealedCards.length < 3) {
      const {
        selected: replacementCards,
        remaining: remainingAfterReplacement,
      } = getRandomCards(1, newAvailableCards);
      if (replacementCards.length > 0) {
        newRevealedCards.push(replacementCards[0]);
        setAvailableCards(remainingAfterReplacement);
      } else {
        setAvailableCards(newAvailableCards);
      }
    } else {
      setAvailableCards(newAvailableCards);
    }

    setRevealedCards(newRevealedCards);
  };

  const handlePin = (cardToPin: CardType) => {
    // Remove from revealed cards
    const cardIndex = revealedCards.findIndex(
      (card) => card.id === cardToPin.id
    );
    if (cardIndex === -1) return;

    const newRevealedCards = revealedCards.filter(
      (_, index) => index !== cardIndex
    );
    setRevealedCards(newRevealedCards);

    // Remove from available cards
    const availableIndex = availableCards.findIndex(
      (card) => card.id === cardToPin.id
    );
    const newAvailableCards = [...availableCards];
    if (availableIndex !== -1) {
      newAvailableCards.splice(availableIndex, 1);
    }
    setAvailableCards(newAvailableCards);

    // Call parent's onPin callback
    onPin(cardToPin);

    // Replace with a new random card if available
    if (newAvailableCards.length > 0 && newRevealedCards.length < 3) {
      const {
        selected: replacementCards,
        remaining: remainingAfterReplacement,
      } = getRandomCards(1, newAvailableCards);
      if (replacementCards.length > 0) {
        newRevealedCards.push(replacementCards[0]);
        setAvailableCards(remainingAfterReplacement);
      } else {
        setAvailableCards(newAvailableCards);
      }
    } else {
      setAvailableCards(newAvailableCards);
    }
  };

  const handleUnpin = (cardToUnpin: CardType) => {
    // Call parent's onUnpin callback and get the unpinned card
    const unpinnedCard = onUnpin(cardToUnpin);

    // Add to discarded cards (can be shuffled back in)
    setDiscardedCards([...discardedCards, unpinnedCard]);
  };

  const handleShuffle = () => {
    // Create pool excluding pinned cards (they are "in use")
    let shuffledPool: CardType[] = [];
    cards.forEach((card) => {
      const totalQuantity = card.quantity;
      const pinnedCount = pinnedCards.filter((pc) => pc.id === card.id).length;
      const availableQuantity = totalQuantity - pinnedCount;

      // Add available instances (excluding pinned ones)
      for (let i = 0; i < availableQuantity; i++) {
        shuffledPool.push({ ...card });
      }
    });

    // Add discarded cards back to the pool (they can be shuffled back in)
    shuffledPool = [...shuffledPool, ...discardedCards];

    setAvailableCards(shuffledPool);
    setRevealedCards([]);
    setDiscardedCards([]);
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
          onClick={handleReveal}
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
          onClick={handleShuffle}
          className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Shuffle
        </button>
      </div>

      {revealedCards.length > 0 && (
        <div className="mt-4">
          <RevealedCardStack
            cards={revealedCards}
            onDiscard={handleCardSelect}
            onPin={handlePin}
          />
        </div>
      )}
    </div>
  );
}
