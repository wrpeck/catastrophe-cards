import { Card } from "@/types/card";

export function getRandomCards(
  count: number,
  pool: Card[]
): { selected: Card[]; remaining: Card[] } {
  if (pool.length === 0) return { selected: [], remaining: [] };
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const remaining = shuffled.slice(Math.min(count, shuffled.length));
  return { selected, remaining };
}

export function initializeCardPool(cards: Card[]): Card[] {
  const pool: Card[] = [];
  cards.forEach((card) => {
    for (let i = 0; i < card.quantity; i++) {
      pool.push({ ...card });
    }
  });
  return pool;
}

export function rebuildPoolFromCards(
  cards: Card[],
  pinnedCards: Card[],
  discardedCards: Card[]
): Card[] {
  let pool: Card[] = [];
  
  // Count pinned cards by ID
  const pinnedCounts = new Map<string, number>();
  pinnedCards.forEach((pc) => {
    pinnedCounts.set(pc.id, (pinnedCounts.get(pc.id) || 0) + 1);
  });

  // Add available instances (excluding pinned ones)
  cards.forEach((card) => {
    const totalQuantity = card.quantity;
    const pinnedCount = pinnedCounts.get(card.id) || 0;
    const availableQuantity = totalQuantity - pinnedCount;

    for (let i = 0; i < availableQuantity; i++) {
      pool.push({ ...card });
    }
  });

  // Add discarded cards back to the pool
  pool = [...pool, ...discardedCards];

  return pool;
}

