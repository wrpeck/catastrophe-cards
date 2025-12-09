export interface Card {
  id: string;
  displayName: string;
  flavor: string; // Flavor text with no gameplay effect
  effect: string; // Gameplay effect text
  quantity: number;
  type?: "good" | "bad" | "mixed"; // For Individual Events and Community Events
  isTraitEffect?: string; // For Community Events only - name of the trait that interacts with this event
  cost?: string; // For Desperate Measures cards - the cost of the card
  effect1?: string; // For Wanderer cards - first effect
  effect2?: string; // For Wanderer cards - second effect
}

export type DeckData = Card[];
