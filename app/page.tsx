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
import GameOutcomeBanner from "@/components/GameOutcomeBanner";
import { Card as CardType } from "@/types/card";
import {
  GameState,
  PinnedCardWithDeck,
  PlayerResource,
  Community,
  DeckState,
  Settings,
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

type DeckTab =
  | "individualEvent"
  | "communityEvent"
  | "individualTraits"
  | "communityTraits"
  | "desperateMeasures"
  | "wanderer";

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
    soloRounds: 4,
    turnAssist: true,
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
  const [missingTurnPlayers, setMissingTurnPlayers] = useState<Set<string>>(
    new Set()
  );
  const [missingResourcesPlayers, setMissingResourcesPlayers] = useState<
    Set<string>
  >(new Set());
  const [extraEventCardPlayers, setExtraEventCardPlayers] = useState<
    Set<string>
  >(new Set());
  const [wandererPlayers, setWandererPlayers] = useState<Set<string>>(
    new Set()
  );
  const [badgeRound, setBadgeRound] = useState<number | null>(null); // Round when badges were set
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [turnOrder, setTurnOrder] = useState<(string | "creation")[]>([]);
  const [currentTurnActionIndex, setCurrentTurnActionIndex] = useState(0);
  const [roundCounterAnimate, setRoundCounterAnimate] = useState(false); // Animation trigger for round counter
  const [extinctionCounterAnimate, setExtinctionCounterAnimate] =
    useState(false); // Animation trigger for extinction counter
  const [civilizationCounterAnimate, setCivilizationCounterAnimate] =
    useState(false); // Animation trigger for civilization counter
  const roundIncrementRef = useRef(false); // Track if round increment triggered extinction increment
  const previousTurnOrderRef = useRef<(string | "creation")[]>([]); // Track previous turn order for comparison
  const shouldCheckWinLoseRef = useRef(false); // Track if we should check win/lose conditions after round ends
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [activeDeckTab, setActiveDeckTab] =
    useState<DeckTab>("individualEvent");
  const [gameOutcome, setGameOutcome] = useState<"win" | "lose" | null>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Deck base card data (loaded from JSON)
  const [deck1Cards, setDeck1Cards] = useState<CardType[]>([]);
  const [deck2Cards, setDeck2Cards] = useState<CardType[]>([]);
  const [deck3Cards, setDeck3Cards] = useState<CardType[]>([]);
  const [deck4Cards, setDeck4Cards] = useState<CardType[]>([]);
  const [deck5Cards, setDeck5Cards] = useState<CardType[]>([]);
  const [deck6Cards, setDeck6Cards] = useState<CardType[]>([]);

  // Deck states
  const [deck1State, setDeck1State] = useState<DeckState>({
    availableCards: [],
    revealedCards: [],
    discardedCards: [],
    drawnCard: null,
  });
  const [deck1LastDrawPlayerName, setDeck1LastDrawPlayerName] = useState<
    string | null
  >(null);
  const [deck2LastDrawPlayerName, setDeck2LastDrawPlayerName] = useState<
    string | null
  >(null);
  const [deck2LastDrawRound, setDeck2LastDrawRound] = useState<number | null>(
    null
  );
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
  const [deck6State, setDeck6State] = useState<DeckState>({
    availableCards: [],
    revealedCards: [],
    discardedCards: [],
    drawnCard: null,
  });
  const [deck6LastDrawPlayerName, setDeck6LastDrawPlayerName] = useState<
    string | null
  >(null);

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
            soloRounds: loadedSettings.soloRounds ?? 4,
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
          // Don't set isLoadingSettings to false here - wait for user decision
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
          soloRounds: data.soloRounds ?? 4,
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

  // Parallax scrolling effect for background
  useEffect(() => {
    const handleScroll = () => {
      if (backgroundRef.current) {
        const scrolled = window.scrollY;
        // Move background at 30% of scroll speed for parallax effect
        const parallaxOffset = scrolled * 0.3;
        backgroundRef.current.style.backgroundPosition = `center ${parallaxOffset}px`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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

  useEffect(() => {
    async function loadDeck6() {
      try {
        const response = await fetch("/data/deck6-wanderer.json");
        const data: CardType[] = await response.json();
        setDeck6Cards(data);
        if (deck6State.availableCards.length === 0) {
          setDeck6State({
            availableCards: initializeCardPool(data),
            revealedCards: [],
            discardedCards: [],
            drawnCard: null,
          });
        }
      } catch (error) {
        console.error("Error loading deck6:", error);
      }
    }
    loadDeck6();
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
    // Get current turn's player name before drawing (only for individual players, not communities)
    let playerName: string | null = null;
    if (turnOrder.length > 0 && turnOrder[currentTurnIndex] !== "creation") {
      const currentTurn = turnOrder[currentTurnIndex];
      // Only track individual players, not communities
      const isCommunity = communities.some((c) => c.id === currentTurn);
      if (!isCommunity) {
        playerName = currentTurn; // It's a player name
      }
    }

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

    // Update last draw player name (only if it's an individual player)
    if (playerName) {
      setDeck1LastDrawPlayerName(playerName);
    }
  }, [turnOrder, currentTurnIndex, communities]);

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
    // Get current turn's player/community name before drawing
    let playerName: string | null = null;
    if (turnOrder.length > 0 && turnOrder[currentTurnIndex] !== "creation") {
      const currentTurn = turnOrder[currentTurnIndex];
      // Check if it's a community ID and resolve to community name
      const community = communities.find((c) => c.id === currentTurn);
      playerName = community ? community.name : currentTurn;
    }

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

    // Update last draw player name and round
    if (playerName) {
      setDeck2LastDrawPlayerName(playerName);
      setDeck2LastDrawRound(roundValue);
    }
  }, [turnOrder, currentTurnIndex, communities, roundValue]);

  const handleDeck2Shuffle = useCallback(() => {
    setDeck2State({
      availableCards: initializeCardPool(deck2Cards),
      revealedCards: [],
      discardedCards: [],
      drawnCard: null,
    });
  }, [deck2Cards]);

  // Deck handlers - Deck 6 (Wanderer)
  const handleDeck6CardsLoaded = useCallback((cards: CardType[]) => {
    setDeck6Cards(cards);
    if (deck6State.availableCards.length === 0) {
      setDeck6State({
        availableCards: initializeCardPool(cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }
  }, []);

  const handleDeck6Draw = useCallback(() => {
    // Get current turn's player name before drawing (only for individual players, not communities)
    let playerName: string | null = null;
    if (turnOrder.length > 0 && turnOrder[currentTurnIndex] !== "creation") {
      const currentTurn = turnOrder[currentTurnIndex];
      // Only track individual players, not communities
      const isCommunity = communities.some((c) => c.id === currentTurn);
      if (!isCommunity) {
        playerName = currentTurn; // It's a player name
      }
    }

    setDeck6State((prev) => {
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

    // Update last draw player name (only if it's an individual player)
    if (playerName) {
      setDeck6LastDrawPlayerName(playerName);
    }
  }, [turnOrder, currentTurnIndex, communities]);

  const handleDeck6Shuffle = useCallback(() => {
    setDeck6State({
      availableCards: initializeCardPool(deck6Cards),
      revealedCards: [],
      discardedCards: [],
      drawnCard: null,
    });
  }, [deck6Cards]);

  // Pin/Unpin handlers (must be defined before deck handlers that use them)
  const [nextPinnedId, setNextPinnedId] = useState(1);

  const handlePin = useCallback(
    (card: CardType, deckTitle: string): PinnedCardWithDeck => {
      const pinnedCard: PinnedCardWithDeck = {
        ...card,
        deckTitle,
        pinnedId: `pinned-${nextPinnedId}`,
      };
      setPinnedCards((prev) => [...prev, pinnedCard]);
      setNextPinnedId((prev) => prev + 1);
      return pinnedCard;
    },
    [nextPinnedId]
  );

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

        // After discarding, automatically reveal 3 new cards if available
        if (currentAvailableCards.length >= 3) {
          const { selected, remaining } = getRandomCards(
            3,
            currentAvailableCards
          );
          return {
            ...prev,
            availableCards: remaining,
            revealedCards: selected,
            discardedCards: newDiscardedCards,
          };
        } else {
          // Not enough cards to reveal 3, reveal what's available
          return {
            ...prev,
            availableCards: [],
            revealedCards: currentAvailableCards,
            discardedCards: newDiscardedCards,
          };
        }
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

        // After discarding, automatically reveal 3 new cards if available
        if (currentAvailableCards.length >= 3) {
          const { selected, remaining } = getRandomCards(
            3,
            currentAvailableCards
          );
          return {
            ...prev,
            availableCards: remaining,
            revealedCards: selected,
            discardedCards: newDiscardedCards,
          };
        } else {
          // Not enough cards to reveal 3, reveal what's available
          return {
            ...prev,
            availableCards: [],
            revealedCards: currentAvailableCards,
            discardedCards: newDiscardedCards,
          };
        }
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

        // After discarding, automatically reveal 3 new cards if available
        if (currentAvailableCards.length >= 3) {
          const { selected, remaining } = getRandomCards(
            3,
            currentAvailableCards
          );
          return {
            ...prev,
            availableCards: remaining,
            revealedCards: selected,
            discardedCards: newDiscardedCards,
          };
        } else {
          // Not enough cards to reveal 3, reveal what's available
          return {
            ...prev,
            availableCards: [],
            revealedCards: currentAvailableCards,
            discardedCards: newDiscardedCards,
          };
        }
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
    // Trigger animation if not already triggered by round increment
    if (!roundIncrementRef.current) {
      setExtinctionCounterAnimate(true);
      setTimeout(() => {
        setExtinctionCounterAnimate(false);
      }, 600);
    }
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
    // Trigger animation on manual increment
    setCivilizationCounterAnimate(true);
    setTimeout(() => {
      setCivilizationCounterAnimate(false);
    }, 600);
  };

  const handleCivilizationDecrement = () => {
    setCivilizationValue((prev) => Math.max(0, prev - 1));
  };

  const handleCivilizationReset = () => {
    setCivilizationValue(0);
  };

  const handleRoundIncrement = () => {
    roundIncrementRef.current = true; // Mark that we're doing a round increment
    setRoundValue((prev) => prev + 1);
    // Always increment extinction counter when round increments
    handleExtinctionIncrement();
    // Mark that we should check win/lose conditions after this round ends
    shouldCheckWinLoseRef.current = true;
    // Trigger animations for both counters after React processes value updates
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRoundCounterAnimate(true);
        setExtinctionCounterAnimate(true);
        // Reset animations after animation completes
        setTimeout(() => {
          setRoundCounterAnimate(false);
          setExtinctionCounterAnimate(false);
          roundIncrementRef.current = false;
        }, 600);
      });
    });
  };

  // Check win/lose conditions only at the end of a round (after round increment completes)
  // This effect runs when extinctionValue changes after a round increment
  useEffect(() => {
    // Only check if we just completed a round increment
    if (shouldCheckWinLoseRef.current) {
      shouldCheckWinLoseRef.current = false; // Reset flag

      const c = civilizationValue;
      const e = extinctionValue;
      const cMax = settings.civilizationCounterMax;
      const eMax = settings.extinctionCounterMax;

      // Win condition: C = C Max && C >= E
      if (c === cMax && c >= e) {
        setGameOutcome("win");
        return;
      }

      // Lose condition: E = E Max && E > C
      if (e === eMax && e > c) {
        setGameOutcome("lose");
        return;
      }

      // Game continues - reset outcome if conditions no longer met
      if (
        gameOutcome !== null &&
        (c < cMax || e < eMax || (e === eMax && e <= c))
      ) {
        setGameOutcome(null);
      }
    }
  }, [
    extinctionValue, // Primary dependency - check after extinction increments
    civilizationValue,
    settings.civilizationCounterMax,
    settings.extinctionCounterMax,
    gameOutcome,
  ]);

  // Track badge round and clear badges after two increments
  useEffect(() => {
    // Set badgeRound when any badge becomes active
    const hasAnyBadges =
      missingTurnPlayers.size > 0 ||
      missingResourcesPlayers.size > 0 ||
      extraEventCardPlayers.size > 0;
    if (hasAnyBadges && badgeRound === null) {
      setBadgeRound(roundValue);
    } else if (!hasAnyBadges && badgeRound !== null) {
      // All badges cleared manually, reset badgeRound
      setBadgeRound(null);
    }
  }, [
    missingTurnPlayers,
    missingResourcesPlayers,
    extraEventCardPlayers,
    badgeRound,
    roundValue,
  ]);

  // Clear badges after two round increments (Wanderer badges are not cleared)
  useEffect(() => {
    if (badgeRound !== null && roundValue >= badgeRound + 2) {
      setMissingTurnPlayers(new Set());
      setMissingResourcesPlayers(new Set());
      setExtraEventCardPlayers(new Set());
      setBadgeRound(null);
    }
  }, [roundValue, badgeRound]);

  // Trigger animations when round increments (via ref tracking)
  useEffect(() => {
    if (roundIncrementRef.current) {
      // Animation state is set in handleRoundIncrement, but this ensures it persists
      // The ref will be reset after the animation completes
    }
  }, [roundValue, extinctionValue]);

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

  const handleToggleMissingTurn = (playerName: string) => {
    setMissingTurnPlayers((prev) => {
      const updated = new Set(prev);
      if (updated.has(playerName)) {
        updated.delete(playerName);
      } else {
        updated.add(playerName);
      }
      return updated;
    });
  };

  const handleToggleMissingResources = (playerName: string) => {
    setMissingResourcesPlayers((prev) => {
      const updated = new Set(prev);
      if (updated.has(playerName)) {
        updated.delete(playerName);
      } else {
        updated.add(playerName);
      }
      return updated;
    });
  };

  const handleToggleExtraEventCard = (playerName: string) => {
    setExtraEventCardPlayers((prev) => {
      const updated = new Set(prev);
      if (updated.has(playerName)) {
        updated.delete(playerName);
      } else {
        updated.add(playerName);
      }
      return updated;
    });
  };

  const handleAssignPlayerToCard = (
    card: PinnedCardWithDeck,
    playerName: string | null
  ) => {
    const cardKey = card.pinnedId;
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
    const cardKey = card.pinnedId;
    return cardPlayerAssignments.get(cardKey) || null;
  };

  const handleCreateCommunity = (
    name: string,
    memberPlayerNames: string[],
    optOutPlayers: string[],
    waivedCostPlayers: string[]
  ) => {
    const optOutSet = new Set(optOutPlayers);
    const waivedCostSet = new Set(waivedCostPlayers);
    let totalTransferredResources = 0;

    // Process each joining member: deduct cost (unless waived) and transfer resources
    setPlayerResources((prev) => {
      const updated = prev.map((player) => {
        if (!memberPlayerNames.includes(player.name)) {
          return player; // Not joining, no change
        }

        // Deduct cost from joining members (unless waived)
        const resourcesAfterCost = waivedCostSet.has(player.name)
          ? player.resources // Cost waived, keep all resources
          : Math.max(0, player.resources - settings.communityCostPerMember);

        // Transfer resources if not opted out
        if (!optOutSet.has(player.name)) {
          totalTransferredResources += resourcesAfterCost;
          return { ...player, resources: 0 }; // All resources transferred
        } else {
          return { ...player, resources: resourcesAfterCost }; // Keep remaining after cost (or all if waived)
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
    const updatedCommunities = [...communities, newCommunity];

    // If currently on Creation phase and a community was created, move to first community's turn
    const isOnCreationPhase =
      turnOrder.length > 0 && turnOrder[currentTurnIndex] === "creation";

    setCommunities(updatedCommunities);
    setNextCommunityId(nextCommunityId + 1);

    // After state updates, if we were on Creation phase, move to the new community's turn
    if (isOnCreationPhase) {
      // Compute the new turn order with the updated communities
      // We need to check which players are in communities using the updated list
      const playersInCommunities = new Set<string>();
      updatedCommunities.forEach((community) => {
        community.memberPlayerNames.forEach((name) => {
          playersInCommunities.add(name);
        });
      });

      const individualPlayers = playerResources.filter(
        (player) => !playersInCommunities.has(player.name)
      );
      if (individualPlayers.length > 0) {
        const newTurnOrder: (string | "creation")[] = [
          ...individualPlayers.map((p) => p.name),
          "creation",
          ...updatedCommunities.map((c) => c.id),
        ];
        const firstCommunityIndex = newTurnOrder.findIndex(
          (turn) => turn === newCommunity.id
        );
        if (firstCommunityIndex !== -1) {
          setCurrentTurnIndex(firstCommunityIndex);
        }
      }
    }
  };

  const handleUpdateCommunity = (
    communityId: string,
    updates: Partial<Community>,
    optOutPlayers?: string[],
    waivedCostPlayers?: string[]
  ) => {
    const existingCommunity = communities.find((c) => c.id === communityId);
    if (!existingCommunity) return;

    const optOutSet = optOutPlayers
      ? new Set(optOutPlayers)
      : new Set<string>();
    const waivedCostSet = waivedCostPlayers
      ? new Set(waivedCostPlayers)
      : new Set<string>();
    const oldMemberNames = existingCommunity.memberPlayerNames;
    const newMemberNames = updates.memberPlayerNames || oldMemberNames;

    // Find newly added members
    const newlyAddedMembers = newMemberNames.filter(
      (name) => !oldMemberNames.includes(name)
    );

    // Check if the current turn is one of the players joining
    const currentTurn =
      turnOrder.length > 0 ? turnOrder[currentTurnIndex] : null;
    const isCurrentPlayerJoining =
      currentTurn !== null &&
      currentTurn !== "creation" &&
      newlyAddedMembers.includes(currentTurn as string);

    let additionalResources = 0;

    // Process newly added members: deduct cost (unless waived) and transfer resources
    if (newlyAddedMembers.length > 0) {
      setPlayerResources((prev) => {
        const updated = prev.map((player) => {
          if (!newlyAddedMembers.includes(player.name)) {
            return player; // Not newly joining, no change
          }

          // Deduct cost from newly joining members (unless waived)
          const resourcesAfterCost = waivedCostSet.has(player.name)
            ? player.resources // Cost waived, keep all resources
            : Math.max(0, player.resources - settings.communityCostPerMember);

          // Transfer resources if not opted out
          if (!optOutSet.has(player.name)) {
            additionalResources += resourcesAfterCost;
            return { ...player, resources: 0 }; // All resources transferred
          } else {
            return { ...player, resources: resourcesAfterCost }; // Keep remaining after cost (or all if waived)
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

    // If a player joined during their turn, we'll handle turn advancement in the useEffect
    // that watches for turn order changes. We use a ref to track this scenario.
    if (isCurrentPlayerJoining) {
      // Store the community ID to advance to after state updates
      // This will be handled by the turn order recomputation useEffect
    }
  };

  const handleDisbandCommunity = (communityId: string) => {
    setCommunities((prev) => prev.filter((c) => c.id !== communityId));

    // Find all Community Traits assigned to this community and unpin them
    const communityTraitPinnedIds = new Set<string>();
    communityTraitAssignments.forEach((assignedCommunityId, pinnedId) => {
      if (assignedCommunityId === communityId) {
        communityTraitPinnedIds.add(pinnedId);
      }
    });

    // Unpin all Community Traits assigned to this community
    if (communityTraitPinnedIds.size > 0) {
      setPinnedCards((prev) =>
        prev.filter(
          (card) =>
            !(
              card.deckTitle === "Community Traits" &&
              communityTraitPinnedIds.has(card.pinnedId)
            )
        )
      );
    }

    // Remove community trait assignments
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

  // Check if a player should be a Wanderer (all other players are in communities)
  const shouldBeWanderer = useCallback(
    (playerName: string): boolean => {
      // Get all players in communities
      const playersInCommunities = new Set<string>();
      communities.forEach((community) => {
        community.memberPlayerNames.forEach((name) => {
          playersInCommunities.add(name);
        });
      });

      // Check if all other players (excluding this player) are in communities
      const otherPlayers = playerResources.filter((p) => p.name !== playerName);
      if (otherPlayers.length === 0) return false; // No other players

      return (
        otherPlayers.every((p) => playersInCommunities.has(p.name)) &&
        !playersInCommunities.has(playerName) // This player is not in a community
      );
    },
    [communities, playerResources]
  );

  // Auto-update Wanderer badges based on community membership
  useEffect(() => {
    setWandererPlayers((prev) => {
      const newWanderers = new Set<string>();
      playerResources.forEach((player) => {
        if (shouldBeWanderer(player.name)) {
          newWanderers.add(player.name);
        }
      });
      return newWanderers;
    });
  }, [communities, playerResources, shouldBeWanderer]);

  // Compute turn order: individual players (not in communities) → Creation → Communities
  const computeTurnOrder = useCallback((): (string | "creation")[] => {
    const order: (string | "creation")[] = [];

    // Add individual players (not in communities)
    const individualPlayers = playerResources.filter(
      (player) => !getPlayerCommunity(player.name)
    );
    individualPlayers.forEach((player) => {
      order.push(player.name);
    });

    // If no individual players exist but there are communities, skip Creation and go straight to communities
    if (individualPlayers.length === 0) {
      // Add community IDs directly (skip Creation phase since all players are already in communities)
      communities.forEach((community) => {
        order.push(community.id);
      });
      return order;
    }

    // Add Creation phase
    order.push("creation");

    // Add community IDs
    communities.forEach((community) => {
      order.push(community.id);
    });

    return order;
  }, [playerResources, communities]);

  // Recompute turn order when players, communities, or settings change
  useEffect(() => {
    const newTurnOrder = computeTurnOrder();
    const previousTurnOrder = previousTurnOrderRef.current;
    previousTurnOrderRef.current = newTurnOrder;
    setTurnOrder(newTurnOrder);

    // Adjust currentTurnIndex if it's out of bounds or if all players joined communities
    setCurrentTurnIndex((prev) => {
      // If the previous turn order had individual players and the new one doesn't,
      // and there are communities, advance to the first community's turn
      if (
        previousTurnOrder.length > 0 &&
        newTurnOrder.length > 0 &&
        prev < previousTurnOrder.length
      ) {
        const previousTurn = previousTurnOrder[prev];
        // Check if previous turn was an individual player (not "creation" and not a community ID)
        const wasIndividualPlayer =
          previousTurn !== "creation" &&
          previousTurn !== undefined &&
          !communities.some((c) => c.id === previousTurn);

        // Check if new turn order has no individual players (starts with communities)
        const newOrderStartsWithCommunities =
          newTurnOrder.length > 0 &&
          newTurnOrder[0] !== "creation" &&
          communities.some((c) => c.id === newTurnOrder[0]);

        if (wasIndividualPlayer && newOrderStartsWithCommunities) {
          // All players are now in communities, move to first community
          return 0;
        }
      }

      if (prev >= newTurnOrder.length && newTurnOrder.length > 0) {
        return 0;
      } else if (newTurnOrder.length === 0) {
        return 0;
      }
      return prev;
    });
  }, [computeTurnOrder, communities]);

  // Helper function to get current turn's display name
  const getCurrentTurnName = useCallback((): string => {
    if (turnOrder.length === 0) {
      return "Unknown";
    }

    const currentTurn = turnOrder[currentTurnIndex];

    if (currentTurn === "creation") {
      return "Creation Phase";
    }

    // Check if it's a community ID
    const community = communities.find((c) => c.id === currentTurn);
    if (community) {
      return community.name;
    }

    // Otherwise it's a player name
    return currentTurn;
  }, [turnOrder, currentTurnIndex, communities]);

  // Helper function to check if current turn is a player (not a community)
  const isCurrentTurnPlayer = useCallback((): boolean => {
    if (turnOrder.length === 0) {
      return false;
    }

    const currentTurn = turnOrder[currentTurnIndex];

    // Not a player if it's creation phase
    if (currentTurn === "creation") {
      return false;
    }

    // Check if it's a community ID
    const isCommunity = communities.some((c) => c.id === currentTurn);

    // It's a player if it's not a community
    return !isCommunity;
  }, [turnOrder, currentTurnIndex, communities]);

  // Helper function to check if current turn is Creation phase
  const isCreationTurn = useCallback((): boolean => {
    return (
      turnOrder.length > 0 &&
      currentTurnIndex < turnOrder.length &&
      turnOrder[currentTurnIndex] === "creation"
    );
  }, [turnOrder, currentTurnIndex]);

  // Helper function to wrap turn-based validation - scalable for future validations
  // This function checks Turn Assist setting first, then applies validation logic
  const shouldDisableForTurn = useCallback(
    (validationFn: () => boolean): boolean => {
      // If Turn Assist is disabled, never disable buttons
      if (!(settings.turnAssist ?? true)) {
        return false;
      }
      // Otherwise, use the validation function
      return validationFn();
    },
    [settings.turnAssist]
  );

  // Helper function to get current turn's community (if it's a community turn)
  const getCurrentTurnCommunity = useCallback((): Community | null => {
    if (turnOrder.length === 0) {
      return null;
    }
    const currentTurn = turnOrder[currentTurnIndex];
    if (currentTurn === "creation") {
      return null;
    }
    return communities.find((c) => c.id === currentTurn) || null;
  }, [turnOrder, currentTurnIndex, communities]);

  // Helper function to get current turn's player name (if it's a player turn)
  const getCurrentTurnPlayerName = useCallback((): string | null => {
    if (turnOrder.length === 0) {
      return null;
    }
    const currentTurn = turnOrder[currentTurnIndex];
    if (currentTurn === "creation") {
      return null;
    }
    const isCommunity = communities.some((c) => c.id === currentTurn);
    if (isCommunity) {
      return null;
    }
    return currentTurn;
  }, [turnOrder, currentTurnIndex, communities]);

  // Helper function to get turn actions for current turn
  const getTurnActionsForCurrentTurn = useCallback((): string[] => {
    // Check if current turn is "creation" phase
    if (turnOrder.length > 0 && turnOrder[currentTurnIndex] === "creation") {
      return ["Create Community"];
    }

    const isPlayer = isCurrentTurnPlayer();
    const playerName = getCurrentTurnPlayerName();

    if (isPlayer && playerName) {
      // Individual Player actions
      const actions = [
        "Roll for Resources",
        "Spend Resources",
        "Draw an Event Card",
      ];
      // Add Wanderer card action if player has Wanderer badge
      if (wandererPlayers.has(playerName)) {
        actions.push("Draw a Wanderer card");
      }
      return actions;
    } else {
      // Community actions
      return [
        "Pay Upkeep",
        "Roll for Resources",
        "Spend Resources",
        "Draw an Event Card",
      ];
    }
  }, [
    turnOrder,
    currentTurnIndex,
    isCurrentTurnPlayer,
    getCurrentTurnPlayerName,
    wandererPlayers,
  ]);

  // Turn tracker handlers
  const handleTurnIncrement = () => {
    if (turnOrder.length === 0) return;

    const currentIndex = currentTurnIndex;
    const nextIndex = currentIndex + 1;
    const isAtLastIndex = currentIndex === turnOrder.length - 1;

    // If at end, wrap around and increment round counter
    if (nextIndex >= turnOrder.length) {
      const hasCommunities = communities.length > 0;
      const wrappedIndex = hasCommunities ? nextIndex % turnOrder.length : 0;

      // If wrapping around (reached end of turn order), increment round
      // (handleRoundIncrement will also increment extinction and trigger animations)
      if (isAtLastIndex) {
        handleRoundIncrement();

        // If at least one community exists, increment civilization counter by 1
        if (communities.length > 0) {
          handleCivilizationIncrement();
        }
      }

      setCurrentTurnIndex(wrappedIndex);
    } else {
      setCurrentTurnIndex(nextIndex);
    }
  };

  // Turn action handlers
  const handleTurnActionIncrement = useCallback(() => {
    const turnActions = getTurnActionsForCurrentTurn();
    if (currentTurnActionIndex < turnActions.length - 1) {
      // Move to next action
      setCurrentTurnActionIndex((prev) => prev + 1);
    } else {
      // On last action, advance turn and reset to first action
      handleTurnIncrement();
      setCurrentTurnActionIndex(0);
    }
  }, [currentTurnActionIndex, getTurnActionsForCurrentTurn]);

  const handleTurnActionDecrement = useCallback(() => {
    if (currentTurnActionIndex > 0) {
      setCurrentTurnActionIndex((prev) => prev - 1);
    }
  }, [currentTurnActionIndex]);

  const handleTurnActionReset = useCallback(() => {
    setCurrentTurnActionIndex(0);
  }, []);

  // Reset turn action index when turn changes
  useEffect(() => {
    setCurrentTurnActionIndex(0);
  }, [currentTurnIndex]);

  const handleTurnDecrement = () => {
    if (turnOrder.length === 0) return;

    setCurrentTurnIndex((prev) => {
      const newIndex = prev - 1;
      // Wrap around to end if going below 0
      return newIndex < 0 ? turnOrder.length - 1 : newIndex;
    });
  };

  const handleTurnReset = () => {
    setCurrentTurnIndex(0);
    setCurrentTurnActionIndex(0);
  };

  const handleAssignCommunityTrait = (
    card: PinnedCardWithDeck,
    communityId: string | null
  ) => {
    const cardKey = card.pinnedId;
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
    const cardKey = card.pinnedId;
    return communityTraitAssignments.get(cardKey) || null;
  };

  // Handler for selecting individual traits (pin + auto-assign)
  const handleDeck3Select = useCallback(
    (cardToPin: CardType) => {
      // Calculate cost
      const cost = cardToPin.traitCost ?? 5;

      // Pin the card
      const pinnedCard = handlePin(cardToPin, "Individual Traits");

      // Auto-assign to current turn player if it's a player's turn and decrement resources
      if (turnOrder.length > 0 && turnOrder[currentTurnIndex] !== "creation") {
        const currentTurn = turnOrder[currentTurnIndex];
        const isCommunity = communities.some((c) => c.id === currentTurn);
        if (!isCommunity) {
          // It's a player's turn - decrement resources
          setPlayerResources((prev) =>
            prev.map((player) =>
              player.name === currentTurn
                ? {
                    ...player,
                    resources: Math.max(0, player.resources - cost),
                  }
                : player
            )
          );
          handleAssignPlayerToCard(pinnedCard, currentTurn);
        }
      }

      // Update deck state (same as handleDeck3Pin)
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
    },
    [
      handlePin,
      turnOrder,
      currentTurnIndex,
      communities,
      handleAssignPlayerToCard,
      playerResources,
    ]
  );

  // Handler for selecting community traits (pin + auto-assign)
  const handleDeck4Select = useCallback(
    (cardToPin: CardType) => {
      // Calculate cost (base + member count)
      const baseCost = cardToPin.traitCost ?? 10;
      let totalCost = baseCost;

      // Pin the card
      const pinnedCard = handlePin(cardToPin, "Community Traits");

      // Auto-assign to current turn community if it's a community's turn and decrement resources
      if (turnOrder.length > 0 && turnOrder[currentTurnIndex] !== "creation") {
        const currentTurn = turnOrder[currentTurnIndex];
        const community = communities.find((c) => c.id === currentTurn);
        if (community) {
          // It's a community's turn - calculate total cost and decrement resources
          totalCost = baseCost + community.memberPlayerNames.length;
          setCommunities((prev) =>
            prev.map((c) =>
              c.id === currentTurn
                ? {
                    ...c,
                    resources: Math.max(0, c.resources - totalCost),
                  }
                : c
            )
          );
          handleAssignCommunityTrait(pinnedCard, currentTurn);
        }
      }

      // Update deck state (same as handleDeck4Pin)
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
    },
    [
      handlePin,
      turnOrder,
      currentTurnIndex,
      communities,
      handleAssignCommunityTrait,
    ]
  );

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
      nextPinnedId,
      pinnedCards,
      cardPlayerAssignments: Array.from(cardPlayerAssignments.entries()),
      communityTraitAssignments: Array.from(
        communityTraitAssignments.entries()
      ),
      missingTurnPlayers: Array.from(missingTurnPlayers),
      missingResourcesPlayers: Array.from(missingResourcesPlayers),
      extraEventCardPlayers: Array.from(extraEventCardPlayers),
      wandererPlayers: Array.from(wandererPlayers),
      badgeRound,
      currentTurnIndex,
      turnOrder,
      currentTurnActionIndex,
      individualEventDeck: deck1State,
      communityEventDeck: deck2State,
      individualTraitsDeck: deck3State,
      communityTraitsDeck: deck4State,
      desperateMeasuresDeck: deck5State,
      wandererDeck: deck6State,
      activeDeckTab,
      gameOutcome,
    };
  }, [
    settings,
    extinctionValue,
    civilizationValue,
    roundValue,
    playerResources,
    communities,
    nextCommunityId,
    nextPinnedId,
    pinnedCards,
    cardPlayerAssignments,
    communityTraitAssignments,
    missingTurnPlayers,
    missingResourcesPlayers,
    extraEventCardPlayers,
    badgeRound,
    currentTurnIndex,
    turnOrder,
    currentTurnActionIndex,
    deck1State,
    deck2State,
    deck3State,
    deck4State,
    deck5State,
    activeDeckTab,
    gameOutcome,
  ]);

  const restoreGameState = useCallback((state: GameState) => {
    if (state.settings) {
      // Ensure communityCostPerMember exists (for backward compatibility)
      const loadedSettings = state.settings as Partial<Settings>;
      const settingsWithDefaults: Settings = {
        extinctionCounterMax: loadedSettings.extinctionCounterMax ?? 20,
        civilizationCounterMax: loadedSettings.civilizationCounterMax ?? 20,
        communityCostPerMember: loadedSettings.communityCostPerMember ?? 1,
        soloRounds: loadedSettings.soloRounds ?? 4,
        turnAssist: loadedSettings.turnAssist ?? true,
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
    setNextPinnedId(state.nextPinnedId ?? 1);
    // Handle backward compatibility: if pinned cards don't have pinnedId, generate them
    const pinnedCardsWithIds = state.pinnedCards.map((card, index) => {
      if (!card.pinnedId) {
        return {
          ...card,
          pinnedId: `pinned-${(state.nextPinnedId ?? 1) + index}`,
        };
      }
      return card;
    });
    setPinnedCards(pinnedCardsWithIds);
    // Update nextPinnedId to be higher than any existing pinnedId
    if (pinnedCardsWithIds.length > 0) {
      const maxId = Math.max(
        ...pinnedCardsWithIds.map((card) => {
          const match = card.pinnedId.match(/pinned-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
      );
      setNextPinnedId(maxId + 1);
    }
    setCardPlayerAssignments(new Map(state.cardPlayerAssignments));
    setCommunityTraitAssignments(new Map(state.communityTraitAssignments));
    setMissingTurnPlayers(new Set(state.missingTurnPlayers || []));
    setMissingResourcesPlayers(new Set(state.missingResourcesPlayers || []));
    setExtraEventCardPlayers(new Set(state.extraEventCardPlayers || []));
    setWandererPlayers(new Set(state.wandererPlayers || []));
    setBadgeRound(state.badgeRound ?? null);
    setCurrentTurnIndex(state.currentTurnIndex ?? 0);
    setTurnOrder(state.turnOrder ?? []);
    setCurrentTurnActionIndex(state.currentTurnActionIndex ?? 0);
    setDeck1State(state.individualEventDeck);
    setDeck2State(state.communityEventDeck);
    setDeck3State(state.individualTraitsDeck);
    setDeck4State(state.communityTraitsDeck);
    setDeck5State(state.desperateMeasuresDeck);
    setDeck6State(
      state.wandererDeck || {
        availableCards: [],
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      }
    );
    setActiveDeckTab(state.activeDeckTab);
    setGameOutcome(state.gameOutcome ?? null);
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (isLoadingSettings || isLoadingGame || showLoadPrompt) return;

    const timeoutId = setTimeout(() => {
      try {
        const state = buildGameState();
        saveGameState(state);
      } catch (error) {
        console.error("Error auto-saving:", error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [buildGameState, isLoadingSettings, isLoadingGame, showLoadPrompt]);

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
      setIsLoadingSettings(false); // Allow UI to render after loading
      setShowLoadPrompt(false);
    }
  }, [restoreGameState]);

  const handleDismissLoadPrompt = useCallback(() => {
    // Clear localStorage and reset game state when starting new
    clearGameState();

    // Reset all game state to initial values
    setExtinctionValue(0);
    setCivilizationValue(0);
    setRoundValue(0);
    setPinnedCards([]);
    setCardPlayerAssignments(new Map());
    setCommunityTraitAssignments(new Map());
    setMissingTurnPlayers(new Set());
    setMissingResourcesPlayers(new Set());
    setExtraEventCardPlayers(new Set());
    setWandererPlayers(new Set());
    setBadgeRound(null);
    setCurrentTurnIndex(0);
    setTurnOrder([]);
    setCurrentTurnActionIndex(0);
    setCommunities([]);
    setNextCommunityId(1);
    setNextPinnedId(1);
    setDeck1LastDrawPlayerName(null);
    setDeck2LastDrawPlayerName(null);
    setDeck2LastDrawRound(null);
    setGameOutcome(null);

    // Reset player resources to 0
    setPlayerResources((prev) =>
      prev.map((player) => ({ ...player, resources: 0 }))
    );

    // Reset all deck states
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
    if (deck6Cards.length > 0) {
      setDeck6State({
        availableCards: initializeCardPool(deck6Cards),
        revealedCards: [],
        discardedCards: [],
        drawnCard: null,
      });
    }

    setActiveDeckTab("individualEvent");
    setIsLoadingSettings(false); // Allow UI to render after dismissing
    setShowLoadPrompt(false);
  }, [deck1Cards, deck2Cards, deck3Cards, deck4Cards, deck5Cards]);

  const handleNewGame = useCallback(() => {
    // Reset all game state to initial values
    setExtinctionValue(0);
    setCivilizationValue(0);
    setRoundValue(0);
    setPinnedCards([]);
    setCardPlayerAssignments(new Map());
    setCommunityTraitAssignments(new Map());
    setMissingTurnPlayers(new Set());
    setMissingResourcesPlayers(new Set());
    setExtraEventCardPlayers(new Set());
    setCurrentTurnActionIndex(0);
    setWandererPlayers(new Set());
    setBadgeRound(null);
    setCurrentTurnIndex(0);
    setTurnOrder([]); // Explicitly reset turn order
    setCommunities([]);
    setNextCommunityId(1);
    setNextPinnedId(1);
    setDeck1LastDrawPlayerName(null);
    setDeck2LastDrawPlayerName(null);
    setDeck2LastDrawRound(null);
    setGameOutcome(null);

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
      const deck3AvailableCards = initializeCardPool(deck3Cards);
      const { selected: deck3Revealed, remaining: deck3Remaining } =
        getRandomCards(3, deck3AvailableCards);
      setDeck3State({
        availableCards: deck3Remaining,
        revealedCards: deck3Revealed,
        discardedCards: [],
        drawnCard: null,
      });
    }
    if (deck4Cards.length > 0) {
      const deck4AvailableCards = initializeCardPool(deck4Cards);
      const { selected: deck4Revealed, remaining: deck4Remaining } =
        getRandomCards(3, deck4AvailableCards);
      setDeck4State({
        availableCards: deck4Remaining,
        revealedCards: deck4Revealed,
        discardedCards: [],
        drawnCard: null,
      });
    }
    if (deck5Cards.length > 0) {
      const deck5AvailableCards = initializeCardPool(deck5Cards);
      const { selected: deck5Revealed, remaining: deck5Remaining } =
        getRandomCards(3, deck5AvailableCards);
      setDeck5State({
        availableCards: deck5Remaining,
        revealedCards: deck5Revealed,
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
      <GameOutcomeBanner outcome={gameOutcome} />
      <div
        ref={backgroundRef}
        className="min-h-screen app-background flex flex-col"
      >
        <div
          className="flex-1 flex flex-col py-8 pb-64 md:pb-48 relative z-10"
          style={gameOutcome ? { paddingTop: "80px" } : {}}
        >
          <div className="w-full">
            <div className="px-4 sm:px-6 lg:px-8 mb-8">
              <PageHeader />
            </div>
            <PageBody
              leftSidebar={
                <div className="space-y-4">
                  <DiceRoller
                    currentTurnIndex={currentTurnIndex}
                    turnOrder={turnOrder}
                    communities={communities}
                  />
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
                      roundValue={roundValue}
                      soloRounds={settings.soloRounds}
                      missingTurnPlayers={missingTurnPlayers}
                      onToggleMissingTurn={handleToggleMissingTurn}
                      missingResourcesPlayers={missingResourcesPlayers}
                      onToggleMissingResources={handleToggleMissingResources}
                      extraEventCardPlayers={extraEventCardPlayers}
                      onToggleExtraEventCard={handleToggleExtraEventCard}
                      wandererPlayers={wandererPlayers}
                      currentTurnIndex={currentTurnIndex}
                      turnOrder={turnOrder}
                      pinnedCards={pinnedCards}
                      cardPlayerAssignments={cardPlayerAssignments}
                      communityTraitAssignments={communityTraitAssignments}
                      individualTraitCards={deck3Cards}
                      communityTraitCards={deck4Cards}
                    />
                  )}
                </div>
              }
              rightSidebar={
                !isLoadingSettings ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
                    <CountersContent
                      roundValue={roundValue}
                      onRoundIncrement={handleRoundIncrement}
                      onRoundDecrement={handleRoundDecrement}
                      onRoundReset={handleRoundReset}
                      roundCounterAnimate={roundCounterAnimate}
                      extinctionValue={extinctionValue}
                      extinctionCounterAnimate={extinctionCounterAnimate}
                      civilizationValue={civilizationValue}
                      civilizationCounterAnimate={civilizationCounterAnimate}
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
                      currentTurnIndex={currentTurnIndex}
                      turnOrder={turnOrder}
                      onTurnIncrement={handleTurnIncrement}
                      onTurnDecrement={handleTurnDecrement}
                      onTurnReset={handleTurnReset}
                      communities={communities}
                      currentTurnActionIndex={currentTurnActionIndex}
                      turnActions={getTurnActionsForCurrentTurn()}
                      onTurnActionIncrement={handleTurnActionIncrement}
                      onTurnActionDecrement={handleTurnActionDecrement}
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
                      lastDrawPlayerName={deck1LastDrawPlayerName}
                      disabled={shouldDisableForTurn(
                        () => !isCurrentTurnPlayer()
                      )}
                      individualTraitCards={deck3Cards}
                      communityTraitCards={deck4Cards}
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
                      lastDrawPlayerName={deck2LastDrawPlayerName}
                      lastDrawRound={deck2LastDrawRound}
                      disabled={shouldDisableForTurn(
                        () => isCurrentTurnPlayer() || isCreationTurn()
                      )}
                      individualTraitCards={deck3Cards}
                      communityTraitCards={deck4Cards}
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
                      onSelect={handleDeck3Select}
                      disabled={shouldDisableForTurn(
                        () => !isCurrentTurnPlayer()
                      )}
                      currentTurnIndex={currentTurnIndex}
                      turnOrder={turnOrder}
                      communities={communities}
                      playerResources={playerResources}
                      turnAssist={settings.turnAssist ?? true}
                      individualTraitCards={deck3Cards}
                      communityTraitCards={deck4Cards}
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
                      onSelect={handleDeck4Select}
                      disabled={shouldDisableForTurn(() =>
                        isCurrentTurnPlayer()
                      )}
                      currentTurnIndex={currentTurnIndex}
                      turnOrder={turnOrder}
                      communities={communities}
                      playerResources={playerResources}
                      turnAssist={settings.turnAssist ?? true}
                      isCreationTurn={isCreationTurn()}
                      individualTraitCards={deck3Cards}
                      communityTraitCards={deck4Cards}
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
                      currentTurnIndex={currentTurnIndex}
                      turnOrder={turnOrder}
                      communities={communities}
                      turnAssist={settings.turnAssist ?? true}
                      isCreationTurn={isCreationTurn()}
                      individualTraitCards={deck3Cards}
                      communityTraitCards={deck4Cards}
                    />
                  ),
                  wanderer: (
                    <DrawDeck
                      title="Wanderer"
                      dataFile="/data/deck6-wanderer.json"
                      availableCards={deck6State.availableCards}
                      drawnCard={deck6State.drawnCard}
                      onDraw={handleDeck6Draw}
                      onShuffle={handleDeck6Shuffle}
                      onCardsLoaded={handleDeck6CardsLoaded}
                      lastDrawPlayerName={deck6LastDrawPlayerName}
                      disabled={shouldDisableForTurn(() => {
                        return (
                          wandererPlayers.size === 0 ||
                          !(
                            turnOrder.length > 0 &&
                            turnOrder[currentTurnIndex] !== "creation" &&
                            !communities.some(
                              (c) => c.id === turnOrder[currentTurnIndex]
                            ) &&
                            wandererPlayers.has(turnOrder[currentTurnIndex])
                          )
                        );
                      })}
                      individualTraitCards={deck3Cards}
                      communityTraitCards={deck4Cards}
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
        individualTraitCards={deck3Cards}
        communityTraitCards={deck4Cards}
      />
      {!isLoadingSettings && (
        <CountersSidebar
          roundValue={roundValue}
          onRoundIncrement={handleRoundIncrement}
          onRoundDecrement={handleRoundDecrement}
          onRoundReset={handleRoundReset}
          roundCounterAnimate={roundCounterAnimate}
          extinctionValue={extinctionValue}
          extinctionCounterAnimate={extinctionCounterAnimate}
          civilizationValue={civilizationValue}
          civilizationCounterAnimate={civilizationCounterAnimate}
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
          currentTurnIndex={currentTurnIndex}
          turnOrder={turnOrder}
          onTurnIncrement={handleTurnIncrement}
          onTurnDecrement={handleTurnDecrement}
          onTurnReset={handleTurnReset}
          communities={communities}
          currentTurnActionIndex={currentTurnActionIndex}
          turnActions={getTurnActionsForCurrentTurn()}
          onTurnActionIncrement={handleTurnActionIncrement}
          onTurnActionDecrement={handleTurnActionDecrement}
        />
      )}
    </>
  );
}
