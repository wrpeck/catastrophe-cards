"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import DrawDeck from "@/components/DrawDeck";
import RevealDeck from "@/components/RevealDeck";
import PinnedCardsBar from "@/components/PinnedCardsBar";
import CountersSidebar from "@/components/CountersSidebar";
import CountersContent from "@/components/CountersContent";
import PageHeader from "@/components/PageHeader";
import PageBody from "@/components/PageBody";
import DiceRoller from "@/components/DiceRoller";
import PlayerTracker from "@/components/PlayerTracker";
import DeckTabs from "@/components/DeckTabs";
import SaveLoadControls from "@/components/SaveLoadControls";
import { Card as CardType } from "@/types/card";
import {
  GameState,
  PinnedCardWithDeck,
  PlayerResource,
  Community,
  DeckState,
} from "@/types/gameState";
import {
  saveGameState,
  loadGameState,
  exportGameState,
  importGameState,
  clearGameState,
  hasSavedGameState,
  getSavedGameTimestamp,
} from "@/utils/gameState";
import {
  getRandomCards,
  initializeCardPool,
  rebuildPoolFromCards,
} from "@/utils/deckHelpers";

interface Player {
  name: string;
}

interface Settings {
  extinctionCounterMax: number;
  civilizationCounterMax: number;
  players: Player[];
}

type DeckTab =
  | "individualEvent"
  | "communityEvent"
  | "individualTraits"
  | "communityTraits"
  | "desperateMeasures";

export default function Home() {
  // Core game state
  const [pinnedCards, setPinnedCards] = useState<PinnedCardWithDeck[]>([]);
  const [extinctionValue, setExtinctionValue] = useState(0);
  const [civilizationValue, setCivilizationValue] = useState(0);
  const [roundValue, setRoundValue] = useState(0);
  const [settings, setSettings] = useState<Settings>({
    extinctionCounterMax: 20,
    civilizationCounterMax: 20,
    communityCostPerMember: 1,
    players: [],
  });
  const [playerResources, setPlayerResources] = useState<PlayerResource[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [nextCommunityId, setNextCommunityId] = useState(1);
  const [cardPlayerAssignments, setCardPlayerAssignments] = useState<
    Map<string, string>
  >(new Map());
  const [communityTraitAssignments, setCommunityTraitAssignments] = useState<
    Map<string, string>
  >(new Map());
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [activeDeckTab, setActiveDeckTab] =
    useState<DeckTab>("individualEvent");

  // Deck base card data (loaded from JSON)
  const [deck1Cards, setDeck1Cards] = useState<CardType[]>([]);
  const [deck2Cards, setDeck2Cards] = useState<CardType[]>([]);
  const [deck3Cards, setDeck3Cards] = useState<CardType[]>([]);
  const [deck4Cards, setDeck4Cards] = useState<CardType[]>([]);
  const [deck5Cards, setDeck5Cards] = useState<CardType[]>([]);

  // Deck states
  const [deck1State, setDeck1State] = useState<DeckState>({
    availableCards: [],
    revealedCards: [],
    discardedCards: [],
    drawnCard: null,
  });
  const [deck2State, setDeck2State] = useState<DeckState>({
    availableCards: [],
    revealedCards: [],
    discardedCards: [],
    drawnCard: null,
  });
  const [deck3State, setDeck3State] = useState<DeckState>({
    availableCards: [],
    revealedCards: [],
    discardedCards: [],
    drawnCard: null,
  });
  const [deck4State, setDeck4State] = useState<DeckState>({
    availableCards: [],
    revealedCards: [],
    discardedCards: [],
    drawnCard: null,
  });
  const [deck5State, setDeck5State] = useState<DeckState>({
    availableCards: [],
    revealedCards: [],
    discardedCards: [],
    drawnCard: null,
  });

  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [showLoadPrompt, setShowLoadPrompt] = useState(false);

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        // Check for saved game first - if it exists and has settings, use those
        const savedState = loadGameState();
        if (savedState && savedState.settings) {
          // Ensure communityCostPerMember exists (for backward compatibility)
          const loadedSettings = savedState.settings as Partial<Settings>;
          const settingsWithDefaults: Settings = {
            extinctionCounterMax: loadedSettings.extinctionCounterMax ?? 20,
            civilizationCounterMax: loadedSettings.civilizationCounterMax ?? 20,
            communityCostPerMember: loadedSettings.communityCostPerMember ?? 1,
            players: loadedSettings.players ?? [],
          };
          setSettings(settingsWithDefaults);
          const savedResources: PlayerResource[] =
            settingsWithDefaults.players.map((player) => {
              const existing = savedState.playerResources.find(
                (pr) => pr.name === player.name
              );
              return existing || { name: player.name, resources: 0 };
            });
          setPlayerResources(savedResources);
          setIsLoadingSettings(false);
          setShowLoadPrompt(true);
          return;
        }

        // Otherwise, load from JSON file
        const response = await fetch("/data/settings.json");
        const data = (await response.json()) as Partial<Settings>;
        // Ensure communityCostPerMember exists (for backward compatibility)
        const settingsWithDefaults: Settings = {
          extinctionCounterMax: data.extinctionCounterMax ?? 20,
          civilizationCounterMax: data.civilizationCounterMax ?? 20,
          communityCostPerMember: data.communityCostPerMember ?? 1,
          players: data.players ?? [],
        };
        setSettings(settingsWithDefaults);
        const initialResources: PlayerResource[] =
          settingsWithDefaults.players.map((player) => ({
            name: player.name,
            resources: 0,
          }));
        setPlayerResources(initialResources);
        setIsLoadingSettings(false);

        // Check for saved game after settings load
        if (hasSavedGameState()) {
          setShowLoadPrompt(true);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  // Load deck cards
  useEffect(() => {
    async function loadDeck1() {
      try {
        const response = await fetch("/data/deck1-individual-event.json");
        const data: CardType[] = await response.json();
        setDeck1Cards(data);
        if (deck1State.availableCards.length === 0) {
          setDeck1State({
            availableCards: initializeCardPool(data),
            revealedCards: [],
            discardedCards: [],
            drawnCard: null,
          });
        }
      } catch (error) {
        console.error("Error loading deck1:", error);
      }
    }
    loadDeck1();
  }, []);

  useEffect(() => {
    async function loadDeck2() {
      try {
        const response = await fetch("/data/deck2-community-event.json");
        const data: CardType[] = await response.json();
        setDeck2Cards(data);
        if (deck2State.availableCards.length === 0) {
          setDeck2State({
            availableCards: initializeCardPool(data),
            revealedCards: [],
            discardedCards: [],
            drawnCard: null,
          });
        }
      } catch (error) {
        console.error("Error loading deck2:", error);
      }
    }
    loadDeck2();
  }, []);

  useEffect(() => {
    async function loadDeck3() {
      try {
        const response = await fetch("/data/deck3-individual-trait.json");
        const data: CardType[] = await response.json();
        setDeck3Cards(data);
        if (deck3State.availableCards.length === 0) {
          setDeck3State({
            availableCards: initializeCardPool(data),
            revealedCards: [],
            discardedCards: [],
            drawnCard: null,
          });
        }
      } catch (error) {
        console.error("Error loading deck3:", error);
      }
    }
    loadDeck3();
  }, []);

  useEffect(() => {
    async function loadDeck4() {
      try {
        const response = await fetch("/data/deck4-community-trait.json");
        const data: CardType[] = await response.json();
        setDeck4Cards(data);
        if (deck4State.availableCards.length === 0) {
          setDeck4State({
            availableCards: initializeCardPool(data),
            revealedCards: [],
            discardedCards: [],
            drawnCard: null,
          });
        }
      } catch (error) {
        console.error("Error loading deck4:", error);
      }
    }
    loadDeck4();
  }, []);

  useEffect(() => {
    async function loadDeck5() {
      try {
        const response = await fetch("/data/deck5-desperate-measures.json");
        const data: CardType[] = await response.json();
        setDeck5Cards(data);
        if (deck5State.availableCards.length === 0) {
          setDeck5State({
            availableCards: initializeCardPool(data),
            revealedCards: [],
            discardedCards: [],
            drawnCard: null,
          });
        }
      } catch (error) {
        console.error("Error loading deck5:", error);
      }
    }
    loadDeck5();
  }, []);

  // Deck handlers - Deck 1 (Individual Event)
  const handleDeck1CardsLoaded = useCallback((cards: CardType[]) => {
    setDeck1Cards(cards);
    if (deck1State.availableCards.length === 0) {
      setDeck1State({
        availableCards: initializeCardPool(cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }
  }, []);

  const handleDeck1Draw = useCallback(() => {
    setDeck1State((prev) => {
      if (prev.availableCards.length === 0) return prev;
      const randomIndex = Math.floor(
        Math.random() * prev.availableCards.length
      );
      const selectedCard = prev.availableCards[randomIndex];
      const newAvailableCards = [...prev.availableCards];
      newAvailableCards.splice(randomIndex, 1);
      return {
        ...prev,
        availableCards: newAvailableCards,
        drawnCard: selectedCard,
      };
    });
  }, []);

  const handleDeck1Shuffle = useCallback(() => {
    setDeck1State({
      availableCards: initializeCardPool(deck1Cards),
      revealedCards: [],
      discardedCards: [],
      drawnCard: null,
    });
  }, [deck1Cards]);

  // Deck handlers - Deck 2 (Community Event)
  const handleDeck2CardsLoaded = useCallback((cards: CardType[]) => {
    setDeck2Cards(cards);
    if (deck2State.availableCards.length === 0) {
      setDeck2State({
        availableCards: initializeCardPool(cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }
  }, []);

  const handleDeck2Draw = useCallback(() => {
    setDeck2State((prev) => {
      if (prev.availableCards.length === 0) return prev;
      const randomIndex = Math.floor(
        Math.random() * prev.availableCards.length
      );
      const selectedCard = prev.availableCards[randomIndex];
      const newAvailableCards = [...prev.availableCards];
      newAvailableCards.splice(randomIndex, 1);
      return {
        ...prev,
        availableCards: newAvailableCards,
        drawnCard: selectedCard,
      };
    });
  }, []);

  const handleDeck2Shuffle = useCallback(() => {
    setDeck2State({
      availableCards: initializeCardPool(deck2Cards),
      revealedCards: [],
      discardedCards: [],
      drawnCard: null,
    });
  }, [deck2Cards]);

  // Pin/Unpin handlers (must be defined before deck handlers that use them)
  const handlePin = useCallback((card: CardType, deckTitle: string) => {
    setPinnedCards((prev) => [...prev, { ...card, deckTitle }]);
  }, []);

  // Deck handlers - Deck 3 (Individual Traits)
  const handleDeck3CardsLoaded = useCallback((cards: CardType[]) => {
    setDeck3Cards(cards);
    if (deck3State.availableCards.length === 0) {
      setDeck3State({
        availableCards: initializeCardPool(cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }
  }, []);

  const handleDeck3Reveal = useCallback(() => {
    setDeck3State((prev) => {
      let currentAvailableCards = [...prev.availableCards];

      // If cards are already revealed, discard all
      if (prev.revealedCards.length > 0) {
        const newDiscardedCards = [
          ...prev.discardedCards,
          ...prev.revealedCards,
        ];
        prev.revealedCards.forEach((revealedCard) => {
          const index = currentAvailableCards.findIndex(
            (card) => card.id === revealedCard.id
          );
          if (index !== -1) {
            currentAvailableCards.splice(index, 1);
          }
        });
        return {
          ...prev,
          availableCards: currentAvailableCards,
          revealedCards: [],
          discardedCards: newDiscardedCards,
        };
      }

      // Reveal 3 new cards
      const { selected, remaining } = getRandomCards(3, currentAvailableCards);
      return {
        ...prev,
        availableCards: remaining,
        revealedCards: selected,
      };
    });
  }, []);

  const handleDeck3CardSelect = useCallback((selectedCard: CardType) => {
    setDeck3State((prev) => {
      const cardToRemoveIndex = prev.revealedCards.findIndex(
        (card) => card.id === selectedCard.id
      );
      if (cardToRemoveIndex === -1) return prev;

      const newRevealedCards = prev.revealedCards.filter(
        (_, index) => index !== cardToRemoveIndex
      );
      const newDiscardedCards = [...prev.discardedCards, selectedCard];

      const newAvailableCards = [...prev.availableCards];
      const cardIndex = newAvailableCards.findIndex(
        (card) => card.id === selectedCard.id
      );
      if (cardIndex !== -1) {
        newAvailableCards.splice(cardIndex, 1);
      }

      // Replace with a new random card if available
      if (newAvailableCards.length > 0 && newRevealedCards.length < 3) {
        const { selected: replacementCards, remaining } = getRandomCards(
          1,
          newAvailableCards
        );
        if (replacementCards.length > 0) {
          newRevealedCards.push(replacementCards[0]);
          return {
            ...prev,
            availableCards: remaining,
            revealedCards: newRevealedCards,
            discardedCards: newDiscardedCards,
          };
        }
      }

      return {
        ...prev,
        availableCards: newAvailableCards,
        revealedCards: newRevealedCards,
        discardedCards: newDiscardedCards,
      };
    });
  }, []);

  const handleDeck3Pin = useCallback(
    (cardToPin: CardType) => {
      setDeck3State((prev) => {
        const cardIndex = prev.revealedCards.findIndex(
          (card) => card.id === cardToPin.id
        );
        if (cardIndex === -1) return prev;

        const newRevealedCards = prev.revealedCards.filter(
          (_, index) => index !== cardIndex
        );

        const newAvailableCards = [...prev.availableCards];
        const availableIndex = newAvailableCards.findIndex(
          (card) => card.id === cardToPin.id
        );
        if (availableIndex !== -1) {
          newAvailableCards.splice(availableIndex, 1);
        }

        // Replace with a new random card if available
        if (newAvailableCards.length > 0 && newRevealedCards.length < 3) {
          const { selected: replacementCards, remaining } = getRandomCards(
            1,
            newAvailableCards
          );
          if (replacementCards.length > 0) {
            newRevealedCards.push(replacementCards[0]);
            return {
              ...prev,
              availableCards: remaining,
              revealedCards: newRevealedCards,
            };
          }
        }

        return {
          ...prev,
          availableCards: newAvailableCards,
          revealedCards: newRevealedCards,
        };
      });
      handlePin(cardToPin, "Individual Traits");
    },
    [handlePin]
  );

  const handleDeck3Shuffle = useCallback(() => {
    setDeck3State((prev) => {
      const pinnedForDeck = pinnedCards.filter(
        (c) => c.deckTitle === "Individual Traits"
      );
      return {
        availableCards: rebuildPoolFromCards(
          deck3Cards,
          pinnedForDeck,
          prev.discardedCards
        ),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      };
    });
  }, [deck3Cards, pinnedCards]);

  const handleDeck3Unpin = useCallback(
    (card: CardType): CardType => {
      const pinnedCard = pinnedCards.find(
        (c) => c.id === card.id && c.deckTitle === "Individual Traits"
      );
      if (pinnedCard) {
        const unpinIndex = pinnedCards.findIndex(
          (c) => c.id === pinnedCard.id && c.deckTitle === pinnedCard.deckTitle
        );
        if (unpinIndex !== -1) {
          setPinnedCards(
            pinnedCards.filter((_, index) => index !== unpinIndex)
          );
          const cardKey = `${pinnedCard.id}-${pinnedCard.deckTitle}`;
          setCardPlayerAssignments((prev) => {
            const updated = new Map(prev);
            updated.delete(cardKey);
            return updated;
          });
          setCommunityTraitAssignments((prev) => {
            const updated = new Map(prev);
            updated.delete(cardKey);
            return updated;
          });
          setDeck3State((prev) => ({
            ...prev,
            discardedCards: [...prev.discardedCards, pinnedCard],
          }));
          return pinnedCard;
        }
      }
      return card;
    },
    [pinnedCards]
  );

  // Deck handlers - Deck 4 (Community Traits) - similar to Deck 3
  const handleDeck4CardsLoaded = useCallback((cards: CardType[]) => {
    setDeck4Cards(cards);
    if (deck4State.availableCards.length === 0) {
      setDeck4State({
        availableCards: initializeCardPool(cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }
  }, []);

  const handleDeck4Reveal = useCallback(() => {
    setDeck4State((prev) => {
      let currentAvailableCards = [...prev.availableCards];

      if (prev.revealedCards.length > 0) {
        const newDiscardedCards = [
          ...prev.discardedCards,
          ...prev.revealedCards,
        ];
        prev.revealedCards.forEach((revealedCard) => {
          const index = currentAvailableCards.findIndex(
            (card) => card.id === revealedCard.id
          );
          if (index !== -1) {
            currentAvailableCards.splice(index, 1);
          }
        });
        return {
          ...prev,
          availableCards: currentAvailableCards,
          revealedCards: [],
          discardedCards: newDiscardedCards,
        };
      }

      const { selected, remaining } = getRandomCards(3, currentAvailableCards);
      return {
        ...prev,
        availableCards: remaining,
        revealedCards: selected,
      };
    });
  }, []);

  const handleDeck4CardSelect = useCallback((selectedCard: CardType) => {
    setDeck4State((prev) => {
      const cardToRemoveIndex = prev.revealedCards.findIndex(
        (card) => card.id === selectedCard.id
      );
      if (cardToRemoveIndex === -1) return prev;

      const newRevealedCards = prev.revealedCards.filter(
        (_, index) => index !== cardToRemoveIndex
      );
      const newDiscardedCards = [...prev.discardedCards, selectedCard];

      const newAvailableCards = [...prev.availableCards];
      const cardIndex = newAvailableCards.findIndex(
        (card) => card.id === selectedCard.id
      );
      if (cardIndex !== -1) {
        newAvailableCards.splice(cardIndex, 1);
      }

      if (newAvailableCards.length > 0 && newRevealedCards.length < 3) {
        const { selected: replacementCards, remaining } = getRandomCards(
          1,
          newAvailableCards
        );
        if (replacementCards.length > 0) {
          newRevealedCards.push(replacementCards[0]);
          return {
            ...prev,
            availableCards: remaining,
            revealedCards: newRevealedCards,
            discardedCards: newDiscardedCards,
          };
        }
      }

      return {
        ...prev,
        availableCards: newAvailableCards,
        revealedCards: newRevealedCards,
        discardedCards: newDiscardedCards,
      };
    });
  }, []);

  const handleDeck4Pin = useCallback(
    (cardToPin: CardType) => {
      setDeck4State((prev) => {
        const cardIndex = prev.revealedCards.findIndex(
          (card) => card.id === cardToPin.id
        );
        if (cardIndex === -1) return prev;

        const newRevealedCards = prev.revealedCards.filter(
          (_, index) => index !== cardIndex
        );

        const newAvailableCards = [...prev.availableCards];
        const availableIndex = newAvailableCards.findIndex(
          (card) => card.id === cardToPin.id
        );
        if (availableIndex !== -1) {
          newAvailableCards.splice(availableIndex, 1);
        }

        if (newAvailableCards.length > 0 && newRevealedCards.length < 3) {
          const { selected: replacementCards, remaining } = getRandomCards(
            1,
            newAvailableCards
          );
          if (replacementCards.length > 0) {
            newRevealedCards.push(replacementCards[0]);
            return {
              ...prev,
              availableCards: remaining,
              revealedCards: newRevealedCards,
            };
          }
        }

        return {
          ...prev,
          availableCards: newAvailableCards,
          revealedCards: newRevealedCards,
        };
      });
      handlePin(cardToPin, "Community Traits");
    },
    [handlePin]
  );

  const handleDeck4Shuffle = useCallback(() => {
    setDeck4State((prev) => {
      const pinnedForDeck = pinnedCards.filter(
        (c) => c.deckTitle === "Community Traits"
      );
      return {
        availableCards: rebuildPoolFromCards(
          deck4Cards,
          pinnedForDeck,
          prev.discardedCards
        ),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      };
    });
  }, [deck4Cards, pinnedCards]);

  const handleDeck4Unpin = useCallback(
    (card: CardType): CardType => {
      const pinnedCard = pinnedCards.find(
        (c) => c.id === card.id && c.deckTitle === "Community Traits"
      );
      if (pinnedCard) {
        const unpinIndex = pinnedCards.findIndex(
          (c) => c.id === pinnedCard.id && c.deckTitle === pinnedCard.deckTitle
        );
        if (unpinIndex !== -1) {
          setPinnedCards(
            pinnedCards.filter((_, index) => index !== unpinIndex)
          );
          const cardKey = `${pinnedCard.id}-${pinnedCard.deckTitle}`;
          setCardPlayerAssignments((prev) => {
            const updated = new Map(prev);
            updated.delete(cardKey);
            return updated;
          });
          setCommunityTraitAssignments((prev) => {
            const updated = new Map(prev);
            updated.delete(cardKey);
            return updated;
          });
          setDeck4State((prev) => ({
            ...prev,
            discardedCards: [...prev.discardedCards, pinnedCard],
          }));
          return pinnedCard;
        }
      }
      return card;
    },
    [pinnedCards]
  );

  // Deck handlers - Deck 5 (Desperate Measures) - similar to Deck 3/4
  const handleDeck5CardsLoaded = useCallback((cards: CardType[]) => {
    setDeck5Cards(cards);
    if (deck5State.availableCards.length === 0) {
      setDeck5State({
        availableCards: initializeCardPool(cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }
  }, []);

  const handleDeck5Reveal = useCallback(() => {
    setDeck5State((prev) => {
      let currentAvailableCards = [...prev.availableCards];

      if (prev.revealedCards.length > 0) {
        const newDiscardedCards = [
          ...prev.discardedCards,
          ...prev.revealedCards,
        ];
        prev.revealedCards.forEach((revealedCard) => {
          const index = currentAvailableCards.findIndex(
            (card) => card.id === revealedCard.id
          );
          if (index !== -1) {
            currentAvailableCards.splice(index, 1);
          }
        });
        return {
          ...prev,
          availableCards: currentAvailableCards,
          revealedCards: [],
          discardedCards: newDiscardedCards,
        };
      }

      const { selected, remaining } = getRandomCards(3, currentAvailableCards);
      return {
        ...prev,
        availableCards: remaining,
        revealedCards: selected,
      };
    });
  }, []);

  const handleDeck5CardSelect = useCallback((selectedCard: CardType) => {
    setDeck5State((prev) => {
      const cardToRemoveIndex = prev.revealedCards.findIndex(
        (card) => card.id === selectedCard.id
      );
      if (cardToRemoveIndex === -1) return prev;

      const newRevealedCards = prev.revealedCards.filter(
        (_, index) => index !== cardToRemoveIndex
      );
      const newDiscardedCards = [...prev.discardedCards, selectedCard];

      const newAvailableCards = [...prev.availableCards];
      const cardIndex = newAvailableCards.findIndex(
        (card) => card.id === selectedCard.id
      );
      if (cardIndex !== -1) {
        newAvailableCards.splice(cardIndex, 1);
      }

      if (newAvailableCards.length > 0 && newRevealedCards.length < 3) {
        const { selected: replacementCards, remaining } = getRandomCards(
          1,
          newAvailableCards
        );
        if (replacementCards.length > 0) {
          newRevealedCards.push(replacementCards[0]);
          return {
            ...prev,
            availableCards: remaining,
            revealedCards: newRevealedCards,
            discardedCards: newDiscardedCards,
          };
        }
      }

      return {
        ...prev,
        availableCards: newAvailableCards,
        revealedCards: newRevealedCards,
        discardedCards: newDiscardedCards,
      };
    });
  }, []);

  const handleDeck5Pin = useCallback(
    (cardToPin: CardType) => {
      setDeck5State((prev) => {
        const cardIndex = prev.revealedCards.findIndex(
          (card) => card.id === cardToPin.id
        );
        if (cardIndex === -1) return prev;

        const newRevealedCards = prev.revealedCards.filter(
          (_, index) => index !== cardIndex
        );

        const newAvailableCards = [...prev.availableCards];
        const availableIndex = newAvailableCards.findIndex(
          (card) => card.id === cardToPin.id
        );
        if (availableIndex !== -1) {
          newAvailableCards.splice(availableIndex, 1);
        }

        if (newAvailableCards.length > 0 && newRevealedCards.length < 3) {
          const { selected: replacementCards, remaining } = getRandomCards(
            1,
            newAvailableCards
          );
          if (replacementCards.length > 0) {
            newRevealedCards.push(replacementCards[0]);
            return {
              ...prev,
              availableCards: remaining,
              revealedCards: newRevealedCards,
            };
          }
        }

        return {
          ...prev,
          availableCards: newAvailableCards,
          revealedCards: newRevealedCards,
        };
      });
      handlePin(cardToPin, "Desperate Measures");
    },
    [handlePin]
  );

  const handleDeck5Shuffle = useCallback(() => {
    setDeck5State((prev) => {
      const pinnedForDeck = pinnedCards.filter(
        (c) => c.deckTitle === "Desperate Measures"
      );
      return {
        availableCards: rebuildPoolFromCards(
          deck5Cards,
          pinnedForDeck,
          prev.discardedCards
        ),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      };
    });
  }, [deck5Cards, pinnedCards]);

  const handleDeck5Unpin = useCallback(
    (card: CardType): CardType => {
      const pinnedCard = pinnedCards.find(
        (c) => c.id === card.id && c.deckTitle === "Desperate Measures"
      );
      if (pinnedCard) {
        const unpinIndex = pinnedCards.findIndex(
          (c) => c.id === pinnedCard.id && c.deckTitle === pinnedCard.deckTitle
        );
        if (unpinIndex !== -1) {
          setPinnedCards(
            pinnedCards.filter((_, index) => index !== unpinIndex)
          );
          const cardKey = `${pinnedCard.id}-${pinnedCard.deckTitle}`;
          setCardPlayerAssignments((prev) => {
            const updated = new Map(prev);
            updated.delete(cardKey);
            return updated;
          });
          setCommunityTraitAssignments((prev) => {
            const updated = new Map(prev);
            updated.delete(cardKey);
            return updated;
          });
          setDeck5State((prev) => ({
            ...prev,
            discardedCards: [...prev.discardedCards, pinnedCard],
          }));
          return pinnedCard;
        }
      }
      return card;
    },
    [pinnedCards]
  );

  const handleUnpin = (cardToUnpin: PinnedCardWithDeck): CardType => {
    const unpinIndex = pinnedCards.findIndex(
      (c) => c.id === cardToUnpin.id && c.deckTitle === cardToUnpin.deckTitle
    );
    if (unpinIndex !== -1) {
      setPinnedCards(pinnedCards.filter((_, index) => index !== unpinIndex));

      const cardKey = `${cardToUnpin.id}-${cardToUnpin.deckTitle}`;
      setCardPlayerAssignments((prev) => {
        const updated = new Map(prev);
        updated.delete(cardKey);
        return updated;
      });
      setCommunityTraitAssignments((prev) => {
        const updated = new Map(prev);
        updated.delete(cardKey);
        return updated;
      });
    }
    return cardToUnpin;
  };

  // Counter handlers
  const handleExtinctionIncrement = () => {
    setExtinctionValue((prev) =>
      Math.min(settings.extinctionCounterMax, prev + 1)
    );
  };

  const handleExtinctionDecrement = () => {
    setExtinctionValue((prev) => Math.max(0, prev - 1));
  };

  const handleExtinctionReset = () => {
    setExtinctionValue(0);
  };

  const handleCivilizationIncrement = () => {
    setCivilizationValue((prev) =>
      Math.min(settings.civilizationCounterMax, prev + 1)
    );
  };

  const handleCivilizationDecrement = () => {
    setCivilizationValue((prev) => Math.max(0, prev - 1));
  };

  const handleCivilizationReset = () => {
    setCivilizationValue(0);
  };

  const handleRoundIncrement = () => {
    setRoundValue((prev) => prev + 1);
  };

  const handleRoundDecrement = () => {
    setRoundValue((prev) => Math.max(0, prev - 1));
  };

  const handleRoundReset = () => {
    setRoundValue(0);
  };

  const handlePlayerResourceChange = (
    playerIndex: number,
    newValue: number
  ) => {
    setPlayerResources((prev) => {
      const updated = [...prev];
      updated[playerIndex] = {
        ...updated[playerIndex],
        resources: newValue,
      };
      return updated;
    });
  };

  const handleAssignPlayerToCard = (
    card: PinnedCardWithDeck,
    playerName: string | null
  ) => {
    const cardKey = `${card.id}-${card.deckTitle}`;
    setCardPlayerAssignments((prev) => {
      const updated = new Map(prev);
      if (playerName === null) {
        updated.delete(cardKey);
      } else {
        updated.set(cardKey, playerName);
      }
      return updated;
    });
  };

  const getCardPlayerAssignment = (card: PinnedCardWithDeck): string | null => {
    const cardKey = `${card.id}-${card.deckTitle}`;
    return cardPlayerAssignments.get(cardKey) || null;
  };

  const handleCreateCommunity = (
    name: string,
    memberPlayerNames: string[],
    optOutPlayers: string[]
  ) => {
    const optOutSet = new Set(optOutPlayers);
    let totalTransferredResources = 0;

    // Process each joining member: deduct cost and transfer resources
    setPlayerResources((prev) => {
      const updated = prev.map((player) => {
        if (!memberPlayerNames.includes(player.name)) {
          return player; // Not joining, no change
        }

        // Deduct cost from all joining members
        const resourcesAfterCost = Math.max(
          0,
          player.resources - settings.communityCostPerMember
        );

        // Transfer resources if not opted out
        if (!optOutSet.has(player.name)) {
          totalTransferredResources += resourcesAfterCost;
          return { ...player, resources: 0 }; // All resources transferred
        } else {
          return { ...player, resources: resourcesAfterCost }; // Keep remaining after cost
        }
      });
      return updated;
    });

    const newCommunity: Community = {
      id: `community-${nextCommunityId}`,
      name,
      resources: totalTransferredResources,
      memberPlayerNames,
    };
    setCommunities([...communities, newCommunity]);
    setNextCommunityId(nextCommunityId + 1);
  };

  const handleUpdateCommunity = (
    communityId: string,
    updates: Partial<Community>,
    optOutPlayers?: string[]
  ) => {
    const existingCommunity = communities.find((c) => c.id === communityId);
    if (!existingCommunity) return;

    const optOutSet = optOutPlayers
      ? new Set(optOutPlayers)
      : new Set<string>();
    const oldMemberNames = existingCommunity.memberPlayerNames;
    const newMemberNames = updates.memberPlayerNames || oldMemberNames;

    // Find newly added members
    const newlyAddedMembers = newMemberNames.filter(
      (name) => !oldMemberNames.includes(name)
    );

    let additionalResources = 0;

    // Process newly added members: deduct cost and transfer resources
    if (newlyAddedMembers.length > 0) {
      setPlayerResources((prev) => {
        const updated = prev.map((player) => {
          if (!newlyAddedMembers.includes(player.name)) {
            return player; // Not newly joining, no change
          }

          // Deduct cost from all newly joining members
          const resourcesAfterCost = Math.max(
            0,
            player.resources - settings.communityCostPerMember
          );

          // Transfer resources if not opted out
          if (!optOutSet.has(player.name)) {
            additionalResources += resourcesAfterCost;
            return { ...player, resources: 0 }; // All resources transferred
          } else {
            return { ...player, resources: resourcesAfterCost }; // Keep remaining after cost
          }
        });
        return updated;
      });
    }

    // Update community with new members and add transferred resources
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId
          ? {
              ...c,
              ...updates,
              resources: c.resources + additionalResources,
            }
          : c
      )
    );
  };

  const handleDisbandCommunity = (communityId: string) => {
    setCommunities((prev) => prev.filter((c) => c.id !== communityId));
    setCommunityTraitAssignments((prev) => {
      const updated = new Map(prev);
      for (const [cardKey, assignedCommunityId] of updated.entries()) {
        if (assignedCommunityId === communityId) {
          updated.delete(cardKey);
        }
      }
      return updated;
    });
  };

  const handleCommunityResourceChange = (
    communityId: string,
    newValue: number
  ) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId ? { ...c, resources: newValue } : c
      )
    );
  };

  const getPlayerCommunity = (playerName: string): Community | null => {
    return (
      communities.find((c) => c.memberPlayerNames.includes(playerName)) || null
    );
  };

  const handleAssignCommunityTrait = (
    card: PinnedCardWithDeck,
    communityId: string | null
  ) => {
    const cardKey = `${card.id}-${card.deckTitle}`;
    setCommunityTraitAssignments((prev) => {
      const updated = new Map(prev);
      if (communityId === null) {
        updated.delete(cardKey);
      } else {
        updated.set(cardKey, communityId);
      }
      return updated;
    });
  };

  const getCommunityTraitAssignment = (
    card: PinnedCardWithDeck
  ): string | null => {
    const cardKey = `${card.id}-${card.deckTitle}`;
    return communityTraitAssignments.get(cardKey) || null;
  };

  // Settings handler
  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    // Re-sync player resources based on new settings
    setPlayerResources((prev) => {
      const newPlayerNames = newSettings.players.map((p) => p.name);
      const updated: PlayerResource[] = newPlayerNames.map((name) => {
        const existing = prev.find((p) => p.name === name);
        return existing || { name, resources: 0 };
      });
      // Remove players no longer in settings from assignments
      setCardPlayerAssignments((assignments) => {
        const newAssignments = new Map(assignments);
        for (const [cardKey, playerName] of assignments.entries()) {
          if (!newPlayerNames.includes(playerName)) {
            newAssignments.delete(cardKey);
          }
        }
        return newAssignments;
      });
      return updated;
    });
  }, []);

  // Save/Load functions
  const buildGameState = useCallback((): GameState => {
    return {
      version: "1.0.0",
      timestamp: Date.now(),
      settings,
      extinctionValue,
      civilizationValue,
      roundValue,
      playerResources,
      communities,
      nextCommunityId,
      pinnedCards,
      cardPlayerAssignments: Array.from(cardPlayerAssignments.entries()),
      communityTraitAssignments: Array.from(
        communityTraitAssignments.entries()
      ),
      individualEventDeck: deck1State,
      communityEventDeck: deck2State,
      individualTraitsDeck: deck3State,
      communityTraitsDeck: deck4State,
      desperateMeasuresDeck: deck5State,
      activeDeckTab,
    };
  }, [
    settings,
    extinctionValue,
    civilizationValue,
    roundValue,
    playerResources,
    communities,
    nextCommunityId,
    pinnedCards,
    cardPlayerAssignments,
    communityTraitAssignments,
    deck1State,
    deck2State,
    deck3State,
    deck4State,
    deck5State,
    activeDeckTab,
  ]);

  const restoreGameState = useCallback((state: GameState) => {
    if (state.settings) {
      // Ensure communityCostPerMember exists (for backward compatibility)
      const loadedSettings = state.settings as Partial<Settings>;
      const settingsWithDefaults: Settings = {
        extinctionCounterMax: loadedSettings.extinctionCounterMax ?? 20,
        civilizationCounterMax: loadedSettings.civilizationCounterMax ?? 20,
        communityCostPerMember: loadedSettings.communityCostPerMember ?? 1,
        players: loadedSettings.players ?? [],
      };
      setSettings(settingsWithDefaults);
    }
    setExtinctionValue(state.extinctionValue);
    setCivilizationValue(state.civilizationValue);
    setRoundValue(state.roundValue);
    setPlayerResources(state.playerResources);
    setCommunities(state.communities);
    setNextCommunityId(state.nextCommunityId);
    setPinnedCards(state.pinnedCards);
    setCardPlayerAssignments(new Map(state.cardPlayerAssignments));
    setCommunityTraitAssignments(new Map(state.communityTraitAssignments));
    setDeck1State(state.individualEventDeck);
    setDeck2State(state.communityEventDeck);
    setDeck3State(state.individualTraitsDeck);
    setDeck4State(state.communityTraitsDeck);
    setDeck5State(state.desperateMeasuresDeck);
    setActiveDeckTab(state.activeDeckTab);
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (isLoadingSettings || isLoadingGame) return;

    const timeoutId = setTimeout(() => {
      try {
        const state = buildGameState();
        saveGameState(state);
      } catch (error) {
        console.error("Error auto-saving:", error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [buildGameState, isLoadingSettings, isLoadingGame]);

  const handleLoadGame = useCallback(() => {
    setIsLoadingGame(true);
    try {
      const savedState = loadGameState();
      if (savedState) {
        restoreGameState(savedState);
      }
    } catch (error) {
      console.error("Error loading game:", error);
      alert("Failed to load saved game. Please try again.");
    } finally {
      setIsLoadingGame(false);
      setShowLoadPrompt(false);
    }
  }, [restoreGameState]);

  const handleDismissLoadPrompt = useCallback(() => {
    setShowLoadPrompt(false);
  }, []);

  const handleNewGame = useCallback(() => {
    // Reset all game state to initial values
    setExtinctionValue(0);
    setCivilizationValue(0);
    setRoundValue(0);
    setPinnedCards([]);
    setCardPlayerAssignments(new Map());
    setCommunityTraitAssignments(new Map());
    setCommunities([]);
    setNextCommunityId(1);

    // Reset player resources to 0
    setPlayerResources((prev) =>
      prev.map((player) => ({ ...player, resources: 0 }))
    );

    // Reset all deck states - wait for cards to be loaded
    if (deck1Cards.length > 0) {
      setDeck1State({
        availableCards: initializeCardPool(deck1Cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }
    if (deck2Cards.length > 0) {
      setDeck2State({
        availableCards: initializeCardPool(deck2Cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }
    if (deck3Cards.length > 0) {
      setDeck3State({
        availableCards: initializeCardPool(deck3Cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }
    if (deck4Cards.length > 0) {
      setDeck4State({
        availableCards: initializeCardPool(deck4Cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }
    if (deck5Cards.length > 0) {
      setDeck5State({
        availableCards: initializeCardPool(deck5Cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }

    setActiveDeckTab("individualEvent");
  }, [deck1Cards, deck2Cards, deck3Cards, deck4Cards, deck5Cards]);

  return (
    <>
      {showLoadPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Load Saved Game?</h2>
            <p className="text-gray-600 mb-6">
              A saved game was found. Would you like to load it?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleLoadGame}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Load Game
              </button>
              <button
                onClick={handleDismissLoadPrompt}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Start New
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <div className="flex-1 flex flex-col py-8 pb-64 md:pb-48">
          <div className="w-full">
            <div className="px-4 sm:px-6 lg:px-8 mb-8">
              <PageHeader />
            </div>
            <PageBody
              leftSidebar={
                <div className="space-y-4">
                  <DiceRoller />
                  {!isLoadingSettings && (
                    <PlayerTracker
                      players={playerResources}
                      onResourceChange={handlePlayerResourceChange}
                      communities={communities}
                      availablePlayers={playerResources.map((p) => p.name)}
                      onCommunityResourceChange={handleCommunityResourceChange}
                      onUpdateCommunity={handleUpdateCommunity}
                      onDisbandCommunity={handleDisbandCommunity}
                      onCreateCommunity={handleCreateCommunity}
                      getPlayerCommunity={getPlayerCommunity}
                      playerResources={playerResources}
                      communityCostPerMember={settings.communityCostPerMember}
                    />
                  )}
                </div>
              }
              rightSidebar={
                !isLoadingSettings ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit sticky top-8">
                    <CountersContent
                      roundValue={roundValue}
                      onRoundIncrement={handleRoundIncrement}
                      onRoundDecrement={handleRoundDecrement}
                      onRoundReset={handleRoundReset}
                      extinctionValue={extinctionValue}
                      civilizationValue={civilizationValue}
                      extinctionMax={settings.extinctionCounterMax}
                      civilizationMax={settings.civilizationCounterMax}
                      onExtinctionIncrement={handleExtinctionIncrement}
                      onExtinctionDecrement={handleExtinctionDecrement}
                      onExtinctionReset={handleExtinctionReset}
                      onCivilizationIncrement={handleCivilizationIncrement}
                      onCivilizationDecrement={handleCivilizationDecrement}
                      onCivilizationReset={handleCivilizationReset}
                      gameState={buildGameState()}
                      onStateRestored={restoreGameState}
                      onNewGame={handleNewGame}
                      settings={settings}
                      onSettingsChange={handleSettingsChange}
                    />
                  </div>
                ) : null
              }
            >
              <DeckTabs
                activeTab={activeDeckTab}
                onTabChange={setActiveDeckTab}
              >
                {{
                  individualEvent: (
                    <DrawDeck
                      title="Individual Event"
                      dataFile="/data/deck1-individual-event.json"
                      availableCards={deck1State.availableCards}
                      drawnCard={deck1State.drawnCard}
                      onDraw={handleDeck1Draw}
                      onShuffle={handleDeck1Shuffle}
                      onCardsLoaded={handleDeck1CardsLoaded}
                    />
                  ),
                  communityEvent: (
                    <DrawDeck
                      title="Community Event"
                      dataFile="/data/deck2-community-event.json"
                      availableCards={deck2State.availableCards}
                      drawnCard={deck2State.drawnCard}
                      onDraw={handleDeck2Draw}
                      onShuffle={handleDeck2Shuffle}
                      onCardsLoaded={handleDeck2CardsLoaded}
                    />
                  ),
                  individualTraits: (
                    <RevealDeck
                      title="Individual Traits"
                      dataFile="/data/deck3-individual-trait.json"
                      pinnedCards={pinnedCards.filter(
                        (c) => c.deckTitle === "Individual Traits"
                      )}
                      availableCards={deck3State.availableCards}
                      revealedCards={deck3State.revealedCards}
                      discardedCards={deck3State.discardedCards}
                      onPin={handleDeck3Pin}
                      onUnpin={handleDeck3Unpin}
                      onReveal={handleDeck3Reveal}
                      onCardSelect={handleDeck3CardSelect}
                      onShuffle={handleDeck3Shuffle}
                      onCardsLoaded={handleDeck3CardsLoaded}
                    />
                  ),
                  communityTraits: (
                    <RevealDeck
                      title="Community Traits"
                      dataFile="/data/deck4-community-trait.json"
                      pinnedCards={pinnedCards.filter(
                        (c) => c.deckTitle === "Community Traits"
                      )}
                      availableCards={deck4State.availableCards}
                      revealedCards={deck4State.revealedCards}
                      discardedCards={deck4State.discardedCards}
                      onPin={handleDeck4Pin}
                      onUnpin={handleDeck4Unpin}
                      onReveal={handleDeck4Reveal}
                      onCardSelect={handleDeck4CardSelect}
                      onShuffle={handleDeck4Shuffle}
                      onCardsLoaded={handleDeck4CardsLoaded}
                    />
                  ),
                  desperateMeasures: (
                    <RevealDeck
                      title="Desperate Measures"
                      dataFile="/data/deck5-desperate-measures.json"
                      pinnedCards={pinnedCards.filter(
                        (c) => c.deckTitle === "Desperate Measures"
                      )}
                      availableCards={deck5State.availableCards}
                      revealedCards={deck5State.revealedCards}
                      discardedCards={deck5State.discardedCards}
                      onPin={handleDeck5Pin}
                      onUnpin={handleDeck5Unpin}
                      onReveal={handleDeck5Reveal}
                      onCardSelect={handleDeck5CardSelect}
                      onShuffle={handleDeck5Shuffle}
                      onCardsLoaded={handleDeck5CardsLoaded}
                    />
                  ),
                }}
              </DeckTabs>
            </PageBody>
          </div>
        </div>
      </div>
      <PinnedCardsBar
        pinnedCards={pinnedCards}
        onUnpin={handleUnpin}
        extinctionValue={extinctionValue}
        civilizationValue={civilizationValue}
        roundValue={roundValue}
        players={playerResources.map((p) => p.name)}
        cardPlayerAssignments={cardPlayerAssignments}
        onAssignPlayer={handleAssignPlayerToCard}
        getCardPlayerAssignment={getCardPlayerAssignment}
        communities={communities}
        communityTraitAssignments={communityTraitAssignments}
        onAssignCommunityTrait={handleAssignCommunityTrait}
        getCommunityTraitAssignment={getCommunityTraitAssignment}
      />
      {!isLoadingSettings && (
        <CountersSidebar
          roundValue={roundValue}
          onRoundIncrement={handleRoundIncrement}
          onRoundDecrement={handleRoundDecrement}
          onRoundReset={handleRoundReset}
          extinctionValue={extinctionValue}
          civilizationValue={civilizationValue}
          extinctionMax={settings.extinctionCounterMax}
          civilizationMax={settings.civilizationCounterMax}
          onExtinctionIncrement={handleExtinctionIncrement}
          onExtinctionDecrement={handleExtinctionDecrement}
          onExtinctionReset={handleExtinctionReset}
          onCivilizationIncrement={handleCivilizationIncrement}
          onCivilizationDecrement={handleCivilizationDecrement}
          onCivilizationReset={handleCivilizationReset}
          gameState={buildGameState()}
          onStateRestored={restoreGameState}
          onNewGame={handleNewGame}
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </>
  );
}
