import { Card } from "./card";

export interface PinnedCardWithDeck extends Card {
  deckTitle: string;
}

export interface PlayerResource {
  name: string;
  resources: number;
}

export interface Community {
  id: string;
  name: string;
  resources: number;
  memberPlayerNames: string[];
}

export interface DeckState {
  availableCards: Card[]; // Full card objects for available pool
  revealedCards: Card[]; // Full card objects for revealed cards
  discardedCards: Card[]; // Full card objects for discarded cards
  drawnCard: Card | null; // For DrawDecks only
}

export interface GameState {
  version: string; // Version number for compatibility
  timestamp: number; // When the state was saved
  
  // Counters
  extinctionValue: number;
  civilizationValue: number;
  roundValue: number;
  
  // Players and Communities
  playerResources: PlayerResource[];
  communities: Community[];
  nextCommunityId: number;
  
  // Pinned Cards
  pinnedCards: PinnedCardWithDeck[];
  
  // Assignments (serialized as arrays for JSON compatibility)
  cardPlayerAssignments: [string, string][]; // [cardKey, playerName]
  communityTraitAssignments: [string, string][]; // [cardKey, communityId]
  
  // Deck States
  individualEventDeck: DeckState;
  communityEventDeck: DeckState;
  individualTraitsDeck: DeckState;
  communityTraitsDeck: DeckState;
  desperateMeasuresDeck: DeckState;
  
  // UI State
  activeDeckTab: "individualEvent" | "communityEvent" | "individualTraits" | "communityTraits" | "desperateMeasures";
}

