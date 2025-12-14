import { Card } from "./card";

export interface PinnedCardWithDeck extends Card {
  deckTitle: string;
  pinnedId: string; // Unique identifier for each pinned card instance
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

export interface Settings {
  extinctionCounterMax: number;
  civilizationCounterMax: number;
  communityCostPerMember: number;
  soloRounds: number;
  players: { name: string }[];
  turnAssist?: boolean; // When enabled, enforces turn-based restrictions on card draws and actions
  civilizationPointCost: number; // Cost per civilization point
  extinctionPointCost: number; // Cost per extinction point
  extinctionCompromise: number; // Resources gained from compromise
}

export interface GameState {
  version: string; // Version number for compatibility
  timestamp: number; // When the state was saved

  // Settings
  settings: Settings;

  // Counters
  extinctionValue: number;
  civilizationValue: number;
  roundValue: number;

  // Players and Communities
  playerResources: PlayerResource[];
  communities: Community[];
  nextCommunityId: number;
  nextPinnedId?: number; // Optional for backward compatibility

  // Pinned Cards
  pinnedCards: PinnedCardWithDeck[];

  // Assignments (serialized as arrays for JSON compatibility)
  cardPlayerAssignments: [string, string][]; // [cardKey, playerName]
  communityTraitAssignments: [string, string][]; // [cardKey, communityId]

  // Player Badges (serialized as arrays for JSON compatibility)
  missingTurnPlayers: string[]; // Player names with missing turn badge
  missingResourcesPlayers: string[]; // Player names with missing resources badge
  extraEventCardPlayers: string[]; // Player names with extra event card badge
  wandererPlayers: string[]; // Player names with wanderer badge (auto-managed)
  badgeRound: number | null; // Round when badges were set (for clearing after 2 increments)

  // Turn Tracker
  currentTurnIndex: number; // Index into computed turn order
  turnOrder: (string | "creation")[]; // Serialized turn order for save/load
  currentTurnActionIndex: number; // Index of current turn action (0-based)

  // Deck States
  individualEventDeck: DeckState;
  communityEventDeck: DeckState;
  individualTraitsDeck: DeckState;
  communityTraitsDeck: DeckState;
  desperateMeasuresDeck: DeckState;
  wandererDeck: DeckState;

  // UI State
  activeDeckTab:
    | "individualEvent"
    | "communityEvent"
    | "individualTraits"
    | "communityTraits"
    | "desperateMeasures"
    | "wanderer";

  // Game Outcome
  gameOutcome: "win" | "lose" | null; // null = game in progress
}
