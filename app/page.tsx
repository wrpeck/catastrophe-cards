"use client";

import { useState, useRef, useEffect } from "react";
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
import { Card as CardType } from "@/types/card";

interface PinnedCardWithDeck extends CardType {
  deckTitle: string;
}

interface Player {
  name: string;
}

interface Settings {
  extinctionCounterMax: number;
  civilizationCounterMax: number;
  players: Player[];
}

interface PlayerResource {
  name: string;
  resources: number;
}

interface Community {
  id: string;
  name: string;
  resources: number;
  memberPlayerNames: string[];
}

export default function Home() {
  const [pinnedCards, setPinnedCards] = useState<PinnedCardWithDeck[]>([]);
  const [extinctionValue, setExtinctionValue] = useState(0);
  const [civilizationValue, setCivilizationValue] = useState(0);
  const [roundValue, setRoundValue] = useState(0);
  const [settings, setSettings] = useState<Settings>({
    extinctionCounterMax: 20,
    civilizationCounterMax: 20,
    players: [],
  });
  const [playerResources, setPlayerResources] = useState<PlayerResource[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [nextCommunityId, setNextCommunityId] = useState(1);
  const [cardPlayerAssignments, setCardPlayerAssignments] = useState<
    Map<string, string>
  >(new Map()); // Map of cardKey to playerName
  const [communityTraitAssignments, setCommunityTraitAssignments] = useState<
    Map<string, string>
  >(new Map()); // Map of cardKey to communityId
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const deck3DiscardRef = useRef<(card: CardType) => void>(() => {});
  const deck4DiscardRef = useRef<(card: CardType) => void>(() => {});
  const deck5DiscardRef = useRef<(card: CardType) => void>(() => {});

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/data/settings.json");
        const data: Settings = await response.json();
        setSettings(data);
        // Initialize player resources from settings
        const initialResources: PlayerResource[] = data.players.map(
          (player) => ({
            name: player.name,
            resources: 0,
          })
        );
        setPlayerResources(initialResources);
        setIsLoadingSettings(false);
      } catch (error) {
        console.error("Error loading settings:", error);
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const handlePin = (card: CardType, deckTitle: string) => {
    setPinnedCards([...pinnedCards, { ...card, deckTitle }]);
  };

  const handleUnpin = (cardToUnpin: PinnedCardWithDeck): CardType => {
    // Find and remove the first matching card
    const unpinIndex = pinnedCards.findIndex(
      (c) => c.id === cardToUnpin.id && c.deckTitle === cardToUnpin.deckTitle
    );
    if (unpinIndex !== -1) {
      setPinnedCards(pinnedCards.filter((_, index) => index !== unpinIndex));

      // Clear player/community assignment if exists
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

      // Add to the appropriate deck's discard pile
      if (cardToUnpin.deckTitle === "Individual Traits") {
        deck3DiscardRef.current(cardToUnpin);
      } else if (cardToUnpin.deckTitle === "Community Traits") {
        deck4DiscardRef.current(cardToUnpin);
      } else if (cardToUnpin.deckTitle === "Desperate Measures") {
        deck5DiscardRef.current(cardToUnpin);
      }
    }
    // Return the unpinned card
    return cardToUnpin;
  };

  const handleUnpinFromDeck =
    (deckTitle: string) =>
    (card: CardType): CardType => {
      const pinnedCard = pinnedCards.find(
        (c) => c.id === card.id && c.deckTitle === deckTitle
      );
      if (pinnedCard) {
        return handleUnpin(pinnedCard);
      }
      return card;
    };

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

  // Community management handlers
  const handleCreateCommunity = (name: string, memberPlayerNames: string[]) => {
    const newCommunity: Community = {
      id: `community-${nextCommunityId}`,
      name,
      resources: 0,
      memberPlayerNames,
    };
    setCommunities([...communities, newCommunity]);
    setNextCommunityId(nextCommunityId + 1);
  };

  const handleUpdateCommunity = (
    communityId: string,
    updates: Partial<Community>
  ) => {
    setCommunities((prev) =>
      prev.map((community) =>
        community.id === communityId ? { ...community, ...updates } : community
      )
    );
  };

  const handleDisbandCommunity = (communityId: string) => {
    // Clear community resources and unassign Community Traits
    const community = communities.find((c) => c.id === communityId);
    if (community) {
      // Unassign all Community Traits assigned to this community
      setCommunityTraitAssignments((prev) => {
        const updated = new Map(prev);
        for (const [cardKey, assignedCommunityId] of prev.entries()) {
          if (assignedCommunityId === communityId) {
            updated.delete(cardKey);
          }
        }
        return updated;
      });
    }
    // Remove community
    setCommunities((prev) => prev.filter((c) => c.id !== communityId));
  };

  const handleCommunityResourceChange = (
    communityId: string,
    newValue: number
  ) => {
    setCommunities((prev) =>
      prev.map((community) =>
        community.id === communityId
          ? { ...community, resources: newValue }
          : community
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

  return (
    <>
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
                    />
                  </div>
                ) : null
              }
            >
              <DeckTabs>
                {{
                  individualEvent: (
                    <DrawDeck
                      title="Individual Event"
                      dataFile="/data/deck1-individual-event.json"
                    />
                  ),
                  communityEvent: (
                    <DrawDeck
                      title="Community Event"
                      dataFile="/data/deck2-community-event.json"
                    />
                  ),
                  individualTraits: (
                    <RevealDeck
                      title="Individual Traits"
                      dataFile="/data/deck3-individual-trait.json"
                      pinnedCards={pinnedCards.filter(
                        (c) => c.deckTitle === "Individual Traits"
                      )}
                      onPin={(card) => handlePin(card, "Individual Traits")}
                      onUnpin={handleUnpinFromDeck("Individual Traits")}
                      onAddToDiscardRef={(ref) => {
                        deck3DiscardRef.current = ref;
                      }}
                    />
                  ),
                  communityTraits: (
                    <RevealDeck
                      title="Community Traits"
                      dataFile="/data/deck4-community-trait.json"
                      pinnedCards={pinnedCards.filter(
                        (c) => c.deckTitle === "Community Traits"
                      )}
                      onPin={(card) => handlePin(card, "Community Traits")}
                      onUnpin={handleUnpinFromDeck("Community Traits")}
                      onAddToDiscardRef={(ref) => {
                        deck4DiscardRef.current = ref;
                      }}
                    />
                  ),
                  desperateMeasures: (
                    <RevealDeck
                      title="Desperate Measures"
                      dataFile="/data/deck5-desperate-measures.json"
                      pinnedCards={pinnedCards.filter(
                        (c) => c.deckTitle === "Desperate Measures"
                      )}
                      onPin={(card) => handlePin(card, "Desperate Measures")}
                      onUnpin={handleUnpinFromDeck("Desperate Measures")}
                      onAddToDiscardRef={(ref) => {
                        deck5DiscardRef.current = ref;
                      }}
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
        />
      )}
    </>
  );
}
