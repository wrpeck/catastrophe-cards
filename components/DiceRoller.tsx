"use client";

import { useState, useEffect } from "react";
import {
  Community,
  PinnedCardWithDeck,
  PlayerResource,
} from "@/types/gameState";
import { getCommunityMemberTraits } from "@/utils/communityTraitEffects";

interface DiceRollerProps {
  currentTurnIndex: number;
  turnOrder: (string | "creation")[];
  communities: Community[];
  pinnedCards?: PinnedCardWithDeck[];
  cardPlayerAssignments?: Map<string, string>;
  communityTraitAssignments?: Map<string, string>;
  onCommunityResourceChange?: (communityId: string, newValue: number) => void;
  playerResources?: PlayerResource[];
  onPlayerResourceChange?: (playerIndex: number, newValue: number) => void;
  onBlacksmithReductionChange?: (
    communityId: string,
    reduction: number | null
  ) => void;
  onSawmillReductionChange?: (
    communityId: string,
    reduction: number | null
  ) => void;
  onSchoolhouseReductionChange?: (
    communityId: string,
    reduction: number | null
  ) => void;
}

type DiceMode = "resource" | "d6" | "special";

export default function DiceRoller({
  currentTurnIndex,
  turnOrder,
  communities,
  pinnedCards = [],
  cardPlayerAssignments = new Map(),
  communityTraitAssignments = new Map(),
  onCommunityResourceChange,
  playerResources = [],
  onPlayerResourceChange,
  onBlacksmithReductionChange,
  onSawmillReductionChange,
  onSchoolhouseReductionChange,
}: DiceRollerProps) {
  const [mode, setMode] = useState<DiceMode>("resource");

  // Resource roll state
  const [value, setValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [lastRollTurn, setLastRollTurn] = useState<string | null>(null);
  const [hasRerolledThisTurn, setHasRerolledThisTurn] = useState(false);
  const [lastRerollTurn, setLastRerollTurn] = useState<string | null>(null);
  // For trait effects that roll multiple dice (e.g., Survivalist)
  const [rollValues, setRollValues] = useState<number[] | null>(null);
  const [displayRollValues, setDisplayRollValues] = useState<number[] | null>(
    null
  );

  // D6 roll state
  const [numDice, setNumDice] = useState<number | null>(1);
  const [d6Results, setD6Results] = useState<number[] | null>(null);
  const [d6DisplayResults, setD6DisplayResults] = useState<number[] | null>(
    null
  );
  const [isRollingD6, setIsRollingD6] = useState(false);
  const [hasRerolledOnes, setHasRerolledOnes] = useState(false);
  const [rerollingIndices, setRerollingIndices] = useState<Set<number>>(
    new Set()
  );
  const [isRerolling, setIsRerolling] = useState(false);
  const [lastD6RollTurn, setLastD6RollTurn] = useState<string | null>(null);

  // Special roll state (for Blacksmith, Sawmill, etc.)
  const [blacksmithRoll, setBlacksmithRoll] = useState<number | null>(null);
  const [blacksmithDisplayRoll, setBlacksmithDisplayRoll] = useState<
    number | null
  >(null);
  const [isRollingBlacksmith, setIsRollingBlacksmith] = useState(false);
  const [lastBlacksmithRollTurn, setLastBlacksmithRollTurn] = useState<
    string | null
  >(null);
  const [sawmillRoll, setSawmillRoll] = useState<number | null>(null);
  const [sawmillDisplayRoll, setSawmillDisplayRoll] = useState<number | null>(
    null
  );
  const [isRollingSawmill, setIsRollingSawmill] = useState(false);
  const [lastSawmillRollTurn, setLastSawmillRollTurn] = useState<string | null>(
    null
  );
  const [schoolhouseRoll, setSchoolhouseRoll] = useState<number | null>(null);
  const [schoolhouseDisplayRoll, setSchoolhouseDisplayRoll] = useState<
    number | null
  >(null);
  const [isRollingSchoolhouse, setIsRollingSchoolhouse] = useState(false);
  const [lastSchoolhouseRollTurn, setLastSchoolhouseRollTurn] = useState<
    string | null
  >(null);

  // Helper function to get current turn's display name
  const getCurrentTurnName = (): string => {
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
  };

  // Helper function to get current turn's player name (if it's a player turn)
  const getCurrentTurnPlayerName = (): string | null => {
    if (turnOrder.length === 0) {
      return null;
    }

    const currentTurn = turnOrder[currentTurnIndex];

    if (currentTurn === "creation") {
      return null;
    }

    // Check if it's a community ID
    const isCommunity = communities.some((c) => c.id === currentTurn);
    if (isCommunity) {
      return null;
    }

    // Otherwise it's a player name
    return currentTurn;
  };

  // Get assigned traits for current player
  const getAssignedTraits = (): PinnedCardWithDeck[] => {
    const currentPlayerName = getCurrentTurnPlayerName();
    if (!currentPlayerName) return [];

    return pinnedCards
      .filter((card) => card.deckTitle === "Individual Traits")
      .filter((card) => {
        const cardKey = card.pinnedId;
        return cardPlayerAssignments.get(cardKey) === currentPlayerName;
      });
  };

  // Check if current player has a specific trait
  const hasTrait = (traitName: string): boolean => {
    const assignedTraits = getAssignedTraits();
    return assignedTraits.some((trait) => trait.displayName === traitName);
  };

  // Check if current player has Lucky trait
  const hasLuckyTrait = (): boolean => {
    return hasTrait("Lucky");
  };

  // Check if current player has Survivalist trait
  const hasSurvivalistTrait = (): boolean => {
    return hasTrait("Survivalist");
  };

  // Check if current community has a Lucky member
  const hasCommunityLuckyMember = (): boolean => {
    if (turnOrder.length === 0) {
      return false;
    }

    const currentTurn = turnOrder[currentTurnIndex];
    if (currentTurn === "creation") {
      return false;
    }

    // Check if it's a community turn
    const community = communities.find((c) => c.id === currentTurn);
    if (!community) {
      return false; // Not a community turn
    }

    // Get all individual traits for community members
    const memberTraits = getCommunityMemberTraits(
      community,
      cardPlayerAssignments,
      pinnedCards,
      [] // individualTraitCards not needed for this check
    );

    // Check if any member has Lucky trait
    return memberTraits.some((trait) => trait.displayName === "Lucky");
  };

  // Track the last community turn to detect when a new community turn begins
  const [lastCommunityTurnId, setLastCommunityTurnId] = useState<string | null>(
    null
  );

  // Check if current turn is a community (helper function)
  const getCurrentCommunity = (): Community | null => {
    if (turnOrder.length === 0) {
      return null;
    }

    const currentTurn = turnOrder[currentTurnIndex];
    if (currentTurn === "creation") {
      return null;
    }

    return communities.find((c) => c.id === currentTurn) || null;
  };

  // Reset reroll flag and roll values when turn changes
  useEffect(() => {
    const currentTurnName = getCurrentTurnName();
    // Reset reroll flag if we're on a different turn than when we last rerolled
    if (lastRerollTurn && lastRerollTurn !== currentTurnName) {
      setHasRerolledThisTurn(false);
    }
    // Reset roll values when turn changes
    if (lastRollTurn && lastRollTurn !== currentTurnName) {
      setRollValues(null);
      setDisplayRollValues(null);
    }
    // Reset Blacksmith roll when turn changes
    if (lastBlacksmithRollTurn && lastBlacksmithRollTurn !== currentTurnName) {
      // Clear Blacksmith reduction for previous community before resetting state
      if (onBlacksmithReductionChange) {
        const previousCommunity = communities.find(
          (c) => c.name === lastBlacksmithRollTurn
        );
        if (previousCommunity) {
          onBlacksmithReductionChange(previousCommunity.id, null);
        }
      }
      setBlacksmithRoll(null);
      setBlacksmithDisplayRoll(null);
    }
    // Reset Sawmill roll when turn changes
    if (lastSawmillRollTurn && lastSawmillRollTurn !== currentTurnName) {
      // Clear Sawmill reduction for previous community before resetting state
      if (onSawmillReductionChange) {
        const previousCommunity = communities.find(
          (c) => c.name === lastSawmillRollTurn
        );
        if (previousCommunity) {
          onSawmillReductionChange(previousCommunity.id, null);
        }
      }
      setSawmillRoll(null);
      setSawmillDisplayRoll(null);
    }
    // Reset Schoolhouse roll when turn changes
    if (
      lastSchoolhouseRollTurn &&
      lastSchoolhouseRollTurn !== currentTurnName
    ) {
      // Clear Schoolhouse reduction for previous community before resetting state
      if (onSchoolhouseReductionChange) {
        const previousCommunity = communities.find(
          (c) => c.name === lastSchoolhouseRollTurn
        );
        if (previousCommunity) {
          onSchoolhouseReductionChange(previousCommunity.id, null);
        }
      }
      setSchoolhouseRoll(null);
      setSchoolhouseDisplayRoll(null);
    }
  }, [currentTurnIndex, turnOrder, communities]);

  // Calculate and set dice count when a community's turn begins
  useEffect(() => {
    const currentCommunity = getCurrentCommunity();

    if (currentCommunity) {
      // Check if this is a new community turn (different from last tracked)
      if (lastCommunityTurnId !== currentCommunity.id) {
        // Calculate number of dice: 1 die per member (default)
        let diceCount = currentCommunity.memberPlayerNames.length;

        // Check for Helpless trait: +2 dice for resource rolls
        const memberTraits = getCommunityMemberTraits(
          currentCommunity,
          cardPlayerAssignments,
          pinnedCards,
          [] // individualTraitCards not needed for this check
        );
        const helplessCount = memberTraits.filter(
          (trait) => trait.displayName === "Helpless"
        ).length;

        // Each Helpless member adds +2 dice
        diceCount += helplessCount * 2;

        // Check for Agriculture trait: +1 die
        const hasAgriculture = hasAgricultureTrait();
        if (hasAgriculture) {
          diceCount += 1;
        }

        // Set the dice count (clamp between 1 and 20)
        setNumDice(Math.max(1, Math.min(20, diceCount)));
        // Track this community turn
        setLastCommunityTurnId(currentCommunity.id);
      } else {
        // Same community turn, but traits might have changed - recalculate
        let diceCount = currentCommunity.memberPlayerNames.length;

        const memberTraits = getCommunityMemberTraits(
          currentCommunity,
          cardPlayerAssignments,
          pinnedCards,
          []
        );
        const helplessCount = memberTraits.filter(
          (trait) => trait.displayName === "Helpless"
        ).length;

        diceCount += helplessCount * 2;

        const hasAgriculture = hasAgricultureTrait();
        if (hasAgriculture) {
          diceCount += 1;
        }

        setNumDice(Math.max(1, Math.min(20, diceCount)));
      }
    } else {
      // Not a community turn, reset tracking
      if (lastCommunityTurnId !== null) {
        setLastCommunityTurnId(null);
      }
    }
  }, [
    currentTurnIndex,
    turnOrder,
    communities,
    lastCommunityTurnId,
    cardPlayerAssignments,
    pinnedCards,
    communityTraitAssignments,
  ]);

  // Possible values: 0, 1, or 2
  const possibleValues = [0, 1, 2];

  const rollResourceDice = () => {
    if (isRolling) return;

    const currentTurnName = getCurrentTurnName();
    // Reset reroll flag if this is a new turn
    if (lastRollTurn !== currentTurnName) {
      setHasRerolledThisTurn(false);
    }

    setIsRolling(true);
    setDisplayValue(null);
    setDisplayRollValues(null);

    // Check for trait effects
    const isSurvivalist = hasSurvivalistTrait();

    // Animate rolling by rapidly changing displayed value
    const rollDuration = 1000; // 1 second
    const updateInterval = 50; // Update every 50ms
    const updates = rollDuration / updateInterval;
    let currentUpdate = 0;

    const rollInterval = setInterval(() => {
      if (isSurvivalist) {
        // Roll two dice for Survivalist
        const randomValue1 =
          possibleValues[Math.floor(Math.random() * possibleValues.length)];
        const randomValue2 =
          possibleValues[Math.floor(Math.random() * possibleValues.length)];
        setDisplayRollValues([randomValue1, randomValue2]);
      } else {
        // Single die roll
        const randomValue =
          possibleValues[Math.floor(Math.random() * possibleValues.length)];
        setDisplayValue(randomValue);
      }
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(rollInterval);

        if (isSurvivalist) {
          // Roll two dice, take the higher, add 1
          const finalValue1 =
            possibleValues[Math.floor(Math.random() * possibleValues.length)];
          const finalValue2 =
            possibleValues[Math.floor(Math.random() * possibleValues.length)];
          const higherValue = Math.max(finalValue1, finalValue2);
          const finalValue = higherValue + 1; // Add 1 for Survivalist

          setRollValues([finalValue1, finalValue2]);
          setDisplayRollValues([finalValue1, finalValue2]);
          setValue(finalValue);
          setDisplayValue(finalValue);
        } else {
          // Standard single die roll
          const finalValue =
            possibleValues[Math.floor(Math.random() * possibleValues.length)];
          setValue(finalValue);
          setDisplayValue(finalValue);
          setRollValues(null);
        }

        setLastRollTurn(currentTurnName);
        setIsRolling(false);
      }
    }, updateInterval);
  };

  const rerollResourceDice = () => {
    if (isRolling || hasRerolledThisTurn || value === null) return;
    if (value !== 0 && value !== 1) return; // Only allow reroll for 0 or 1
    if (!hasLuckyTrait()) return; // Only allow if player has Lucky trait

    setIsRolling(true);
    setDisplayValue(null);
    setDisplayRollValues(null);

    // Check for trait effects (Survivalist applies to reroll too)
    const isSurvivalist = hasSurvivalistTrait();

    // Animate rolling by rapidly changing displayed value
    const rollDuration = 1000; // 1 second
    const updateInterval = 50; // Update every 50ms
    const updates = rollDuration / updateInterval;
    let currentUpdate = 0;

    const rollInterval = setInterval(() => {
      if (isSurvivalist) {
        // Roll two dice for Survivalist
        const randomValue1 =
          possibleValues[Math.floor(Math.random() * possibleValues.length)];
        const randomValue2 =
          possibleValues[Math.floor(Math.random() * possibleValues.length)];
        setDisplayRollValues([randomValue1, randomValue2]);
      } else {
        // Single die roll
        const randomValue =
          possibleValues[Math.floor(Math.random() * possibleValues.length)];
        setDisplayValue(randomValue);
      }
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(rollInterval);

        if (isSurvivalist) {
          // Roll two dice, take the higher, add 1
          const finalValue1 =
            possibleValues[Math.floor(Math.random() * possibleValues.length)];
          const finalValue2 =
            possibleValues[Math.floor(Math.random() * possibleValues.length)];
          const higherValue = Math.max(finalValue1, finalValue2);
          const finalValue = higherValue + 1; // Add 1 for Survivalist

          setRollValues([finalValue1, finalValue2]);
          setDisplayRollValues([finalValue1, finalValue2]);
          setValue(finalValue);
          setDisplayValue(finalValue);
        } else {
          // Standard single die reroll
          const finalValue =
            possibleValues[Math.floor(Math.random() * possibleValues.length)];
          setValue(finalValue);
          setDisplayValue(finalValue);
          setRollValues(null);
        }

        setHasRerolledThisTurn(true);
        setLastRerollTurn(getCurrentTurnName());
        setIsRolling(false);
      }
    }, updateInterval);
  };

  const rollD6Dice = () => {
    if (isRollingD6 || numDice === null || numDice < 1 || numDice > 20) return;

    setIsRollingD6(true);
    setIsRerolling(false); // This is an initial roll, not a reroll
    setD6DisplayResults(null);
    setHasRerolledOnes(false); // Reset reroll flag on new roll
    setRerollingIndices(new Set()); // Clear rerolling indices

    // numDice already includes Agriculture bonus from useEffect, so use it directly
    const totalDice = numDice;

    // Animate rolling by rapidly changing displayed values
    const rollDuration = 1000; // 1 second
    const updateInterval = 50; // Update every 50ms
    const updates = rollDuration / updateInterval;
    let currentUpdate = 0;

    const rollInterval = setInterval(() => {
      // Show random values during animation
      const randomResults = Array.from(
        { length: totalDice },
        () => Math.floor(Math.random() * 6) + 1
      );
      setD6DisplayResults(randomResults);
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(rollInterval);
        // Final roll
        const finalResults = Array.from(
          { length: totalDice },
          () => Math.floor(Math.random() * 6) + 1
        );
        setD6Results(finalResults);
        setD6DisplayResults(finalResults);
        setLastD6RollTurn(getCurrentTurnName());
        setIsRollingD6(false);
      }
    }, updateInterval);
  };

  const isValidDiceCount = numDice !== null && numDice >= 1 && numDice <= 20;

  const rerollOnes = () => {
    if (isRollingD6 || !d6Results || hasRerolledOnes) return;

    // Find indices of dice with value 1
    const onesIndices = d6Results
      .map((val, index) => (val === 1 ? index : null))
      .filter((index) => index !== null) as number[];

    if (onesIndices.length === 0) return; // No 1s to reroll

    setIsRollingD6(true);
    setIsRerolling(true); // This is a reroll, not an initial roll
    setRerollingIndices(new Set(onesIndices)); // Track which dice are being rerolled
    setHasRerolledOnes(true); // Mark that we've used the reroll

    // Animate rolling by rapidly changing displayed values
    const rollDuration = 800; // Slightly shorter animation
    const updateInterval = 50;
    const updates = rollDuration / updateInterval;
    let currentUpdate = 0;

    const rollInterval = setInterval(() => {
      // Show random values for ones being rerolled, keep others the same
      const newResults = [...d6Results];
      onesIndices.forEach((index) => {
        newResults[index] = Math.floor(Math.random() * 6) + 1;
      });
      setD6DisplayResults(newResults);
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(rollInterval);
        // Final reroll
        const finalResults = [...d6Results];
        onesIndices.forEach((index) => {
          finalResults[index] = Math.floor(Math.random() * 6) + 1;
        });
        setD6Results(finalResults);
        setD6DisplayResults(finalResults);
        setIsRollingD6(false);
        setIsRerolling(false); // Reset reroll flag after animation
        setRerollingIndices(new Set()); // Clear rerolling indices after animation
      }
    }, updateInterval);
  };

  const hasOnes = d6Results ? d6Results.some((val) => val === 1) : false;
  // Only allow reroll if it's a community turn with a Lucky member
  const canRerollOnes =
    hasOnes && !hasRerolledOnes && !isRollingD6 && hasCommunityLuckyMember();

  const currentDisplay =
    displayValue !== null ? displayValue : value !== null ? value : null;
  const currentD6Display =
    d6DisplayResults !== null ? d6DisplayResults : d6Results;
  const d6Total = currentD6Display
    ? currentD6Display.reduce((sum, val) => sum + val, 0)
    : null;

  const currentCommunity = getCurrentCommunity();

  // Count Cutthroat members in current community
  const getCutthroatMemberCount = (): number => {
    if (!currentCommunity) return 0;

    const memberTraits = getCommunityMemberTraits(
      currentCommunity,
      cardPlayerAssignments,
      pinnedCards,
      [] // individualTraitCards not needed - we search pinnedCards directly
    );

    return memberTraits.filter((trait) => trait.displayName === "Cutthroat")
      .length;
  };

  // Count Survivalist members in current community
  const getSurvivalistMemberCount = (): number => {
    if (!currentCommunity) return 0;

    const memberTraits = getCommunityMemberTraits(
      currentCommunity,
      cardPlayerAssignments,
      pinnedCards,
      [] // individualTraitCards not needed - we search pinnedCards directly
    );

    return memberTraits.filter((trait) => trait.displayName === "Survivalist")
      .length;
  };

  const cutthroatMemberCount = getCutthroatMemberCount();
  const cutthroatBonus = cutthroatMemberCount * 3;
  const survivalistMemberCount = getSurvivalistMemberCount();
  const survivalistBonus = survivalistMemberCount;
  const d6TotalWithBonus =
    d6Total !== null ? d6Total + cutthroatBonus + survivalistBonus : null;

  // Check if current community has Blacksmith trait
  const hasBlacksmithTrait = (): boolean => {
    if (!currentCommunity) return false;

    return Array.from(communityTraitAssignments.entries()).some(
      ([pinnedId, assignedCommunityId]) => {
        if (assignedCommunityId !== currentCommunity.id) return false;
        const pinnedCard = pinnedCards.find(
          (card) =>
            card.pinnedId === pinnedId && card.deckTitle === "Community Traits"
        );
        return pinnedCard?.displayName === "Blacksmith";
      }
    );
  };

  // Check if current community has Sawmill trait
  const hasSawmillTrait = (): boolean => {
    if (!currentCommunity) return false;

    return Array.from(communityTraitAssignments.entries()).some(
      ([pinnedId, assignedCommunityId]) => {
        if (assignedCommunityId !== currentCommunity.id) return false;
        const pinnedCard = pinnedCards.find(
          (card) =>
            card.pinnedId === pinnedId && card.deckTitle === "Community Traits"
        );
        return pinnedCard?.displayName === "Sawmill";
      }
    );
  };

  // Check if current community has Agriculture trait
  const hasAgricultureTrait = (): boolean => {
    if (!currentCommunity) return false;

    return Array.from(communityTraitAssignments.entries()).some(
      ([pinnedId, assignedCommunityId]) => {
        if (assignedCommunityId !== currentCommunity.id) return false;
        const pinnedCard = pinnedCards.find(
          (card) =>
            card.pinnedId === pinnedId && card.deckTitle === "Community Traits"
        );
        return pinnedCard?.displayName === "Agriculture";
      }
    );
  };

  // Check if current community has Schoolhouse trait
  const hasSchoolhouseTrait = (): boolean => {
    if (!currentCommunity) return false;

    return Array.from(communityTraitAssignments.entries()).some(
      ([pinnedId, assignedCommunityId]) => {
        if (assignedCommunityId !== currentCommunity.id) return false;
        const pinnedCard = pinnedCards.find(
          (card) =>
            card.pinnedId === pinnedId && card.deckTitle === "Community Traits"
        );
        return pinnedCard?.displayName === "Schoolhouse";
      }
    );
  };

  // Roll Blacksmith die (0-2, then add +1)
  const rollBlacksmith = () => {
    if (isRollingBlacksmith || !currentCommunity) return;

    setIsRollingBlacksmith(true);
    setBlacksmithDisplayRoll(null);

    // Animate rolling by rapidly changing displayed value
    const rollDuration = 1000; // 1 second
    const updateInterval = 50; // Update every 50ms
    const updates = rollDuration / updateInterval;
    let currentUpdate = 0;

    const rollInterval = setInterval(() => {
      // Show random value between 0-2 during animation
      const randomValue = Math.floor(Math.random() * 3); // 0, 1, or 2
      setBlacksmithDisplayRoll(randomValue);
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(rollInterval);
        // Final roll
        const finalRoll = Math.floor(Math.random() * 3); // 0, 1, or 2
        const finalValue = finalRoll + 1; // Add +1 (result is 1, 2, or 3)
        setBlacksmithRoll(finalValue);
        setBlacksmithDisplayRoll(finalRoll); // Show the die roll (before +1)
        setLastBlacksmithRollTurn(getCurrentTurnName());

        // Notify parent of the reduction amount
        if (onBlacksmithReductionChange) {
          onBlacksmithReductionChange(currentCommunity.id, finalValue);
        }

        setIsRollingBlacksmith(false);
      }
    }, updateInterval);
  };

  // Roll Sawmill die (0-2, then add +1)
  const rollSawmill = () => {
    if (isRollingSawmill || !currentCommunity) return;

    setIsRollingSawmill(true);
    setSawmillDisplayRoll(null);

    // Animate rolling by rapidly changing displayed value
    const rollDuration = 1000; // 1 second
    const updateInterval = 50; // Update every 50ms
    const updates = rollDuration / updateInterval;
    let currentUpdate = 0;

    const rollInterval = setInterval(() => {
      // Show random value between 0-2 during animation
      const randomValue = Math.floor(Math.random() * 3); // 0, 1, or 2
      setSawmillDisplayRoll(randomValue);
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(rollInterval);
        // Final roll
        const finalRoll = Math.floor(Math.random() * 3); // 0, 1, or 2
        const finalValue = finalRoll + 1; // Add +1 (result is 1, 2, or 3)
        setSawmillRoll(finalValue);
        setSawmillDisplayRoll(finalRoll); // Show the die roll (before +1)
        setLastSawmillRollTurn(getCurrentTurnName());

        // Notify parent of the reduction amount
        if (onSawmillReductionChange) {
          onSawmillReductionChange(currentCommunity.id, finalValue);
        }

        setIsRollingSawmill(false);
      }
    }, updateInterval);
  };

  // Roll all special dice together
  const rollSpecialDice = () => {
    if (
      !currentCommunity ||
      isRollingBlacksmith ||
      isRollingSawmill ||
      isRollingSchoolhouse
    )
      return;

    const hasBlacksmith = hasBlacksmithTrait();
    const hasSawmill = hasSawmillTrait();
    const hasSchoolhouse = hasSchoolhouseTrait();

    if (!hasBlacksmith && !hasSawmill && !hasSchoolhouse) return;

    // Set rolling states
    if (hasBlacksmith) {
      setIsRollingBlacksmith(true);
      setBlacksmithDisplayRoll(null);
    }
    if (hasSawmill) {
      setIsRollingSawmill(true);
      setSawmillDisplayRoll(null);
    }
    if (hasSchoolhouse) {
      setIsRollingSchoolhouse(true);
      setSchoolhouseDisplayRoll(null);
    }

    // Animate rolling by rapidly changing displayed values
    const rollDuration = 1000; // 1 second
    const updateInterval = 50; // Update every 50ms
    const updates = rollDuration / updateInterval;
    let currentUpdate = 0;

    const rollInterval = setInterval(() => {
      // Show random values during animation
      if (hasBlacksmith) {
        const randomValue = Math.floor(Math.random() * 3); // 0, 1, or 2
        setBlacksmithDisplayRoll(randomValue);
      }
      if (hasSawmill) {
        const randomValue = Math.floor(Math.random() * 3); // 0, 1, or 2
        setSawmillDisplayRoll(randomValue);
      }
      if (hasSchoolhouse) {
        const randomValue = Math.floor(Math.random() * 6) + 1; // 1-6 for d6
        setSchoolhouseDisplayRoll(randomValue);
      }
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(rollInterval);
        const currentTurnName = getCurrentTurnName();

        // Final rolls
        if (hasBlacksmith) {
          const finalRoll = Math.floor(Math.random() * 3); // 0, 1, or 2
          const finalValue = finalRoll + 1; // Add +1 (result is 1, 2, or 3)
          setBlacksmithRoll(finalValue);
          setBlacksmithDisplayRoll(finalRoll);
          setLastBlacksmithRollTurn(currentTurnName);
          if (onBlacksmithReductionChange) {
            onBlacksmithReductionChange(currentCommunity.id, finalValue);
          }
          setIsRollingBlacksmith(false);
        }

        if (hasSawmill) {
          const finalRoll = Math.floor(Math.random() * 3); // 0, 1, or 2
          const finalValue = finalRoll + 1; // Add +1 (result is 1, 2, or 3)
          setSawmillRoll(finalValue);
          setSawmillDisplayRoll(finalRoll);
          setLastSawmillRollTurn(currentTurnName);
          if (onSawmillReductionChange) {
            onSawmillReductionChange(currentCommunity.id, finalValue);
          }
          setIsRollingSawmill(false);
        }

        if (hasSchoolhouse) {
          const finalValue = Math.floor(Math.random() * 6) + 1; // 1-6
          setSchoolhouseRoll(finalValue);
          setSchoolhouseDisplayRoll(finalValue);
          setLastSchoolhouseRollTurn(currentTurnName);
          if (onSchoolhouseReductionChange) {
            onSchoolhouseReductionChange(currentCommunity.id, finalValue);
          }
          setIsRollingSchoolhouse(false);
        }
      }
    }, updateInterval);
  };

  const isRollingSpecial =
    isRollingBlacksmith || isRollingSawmill || isRollingSchoolhouse;
  const totalSpecialReduction = (blacksmithRoll ?? 0) + (sawmillRoll ?? 0);

  // Add D6 total to community resources
  const handleAddToCommunity = () => {
    if (!d6TotalWithBonus || !onCommunityResourceChange) return;

    if (currentCommunity) {
      const newResources = currentCommunity.resources + d6TotalWithBonus;
      onCommunityResourceChange(currentCommunity.id, newResources);
    }
  };

  const isCommunityTurn = currentCommunity !== null;
  const canAddToCommunity =
    isCommunityTurn &&
    d6TotalWithBonus !== null &&
    !isRollingD6 &&
    onCommunityResourceChange !== undefined;

  // Handle applying roll results to current player's or community's resources
  const handleApply = () => {
    // Check if it's a community turn
    if (currentCommunity && onCommunityResourceChange) {
      if (mode === "d6" && d6TotalWithBonus !== null) {
        const newResources = currentCommunity.resources + d6TotalWithBonus;
        onCommunityResourceChange(currentCommunity.id, newResources);
      }
      return;
    }

    // Otherwise it's a player turn
    const currentPlayerName = getCurrentTurnPlayerName();
    if (!currentPlayerName || !onPlayerResourceChange) return;

    const playerIndex = playerResources.findIndex(
      (p) => p.name === currentPlayerName
    );
    if (playerIndex === -1) return;

    const currentPlayer = playerResources[playerIndex];
    let rollResult: number | null = null;

    if (mode === "resource") {
      rollResult = value;
    } else if (mode === "d6") {
      rollResult = d6TotalWithBonus;
    }

    if (rollResult !== null) {
      const newResources = currentPlayer.resources + rollResult;
      onPlayerResourceChange(playerIndex, newResources);
    }
  };

  const canApply =
    (currentCommunity &&
      onCommunityResourceChange &&
      mode === "d6" &&
      d6TotalWithBonus !== null &&
      !isRollingD6) ||
    (getCurrentTurnPlayerName() !== null &&
      onPlayerResourceChange !== undefined &&
      ((mode === "resource" && value !== null && !isRolling) ||
        (mode === "d6" && d6TotalWithBonus !== null && !isRollingD6)));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dice Roller</h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setMode("resource")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            mode === "resource"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Resource Roll
        </button>
        <button
          onClick={() => setMode("d6")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            mode === "d6"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          D6 Roll
        </button>
        <button
          onClick={() => setMode("special")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            mode === "special"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Special
        </button>
      </div>

      {mode === "resource" ? (
        <div className="flex flex-col items-center gap-4">
          {/* Trait indicator */}
          {hasSurvivalistTrait() && (
            <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
              Survivalist: Roll 2 dice, take higher + 1
            </div>
          )}

          {/* Dice Display */}
          {hasSurvivalistTrait() &&
          (isRolling || rollValues !== null || displayRollValues !== null) ? (
            // Show two dice for Survivalist
            <div className="flex gap-1.5 items-center flex-wrap justify-center max-w-full px-2">
              <div
                className={`w-14 h-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center text-xl font-bold text-gray-800 transition-all duration-75 shrink-0 ${
                  isRolling ? "animate-spin shadow-lg" : "shadow-md"
                }`}
              >
                <span className={isRolling ? "opacity-70" : ""}>
                  {displayRollValues
                    ? displayRollValues[0]
                    : rollValues
                    ? rollValues[0]
                    : "?"}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-600 shrink-0">+</div>
              <div
                className={`w-14 h-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center text-xl font-bold text-gray-800 transition-all duration-75 shrink-0 ${
                  isRolling ? "animate-spin shadow-lg" : "shadow-md"
                }`}
              >
                <span className={isRolling ? "opacity-70" : ""}>
                  {displayRollValues
                    ? displayRollValues[1]
                    : rollValues
                    ? rollValues[1]
                    : "?"}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-600 shrink-0">→</div>
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400 flex flex-col items-center justify-center shadow-md shrink-0 px-1">
                <span className="text-[10px] text-gray-600 leading-tight">
                  Higher
                </span>
                <span className="text-lg font-bold text-gray-900 leading-tight">
                  {displayRollValues
                    ? Math.max(displayRollValues[0], displayRollValues[1])
                    : rollValues
                    ? Math.max(rollValues[0], rollValues[1])
                    : "?"}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-600 shrink-0">+1</div>
              <div
                className={`w-14 h-14 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 flex items-center justify-center text-xl font-bold text-gray-900 shadow-md shrink-0 ${
                  isRolling ? "opacity-70" : ""
                }`}
              >
                {currentDisplay !== null ? currentDisplay : "?"}
              </div>
            </div>
          ) : (
            // Single die display
            <div
              className={`w-24 h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center text-4xl font-bold text-gray-800 transition-all duration-75 ${
                isRolling ? "animate-spin shadow-lg" : "shadow-md"
              }`}
            >
              {currentDisplay !== null ? (
                <span className={isRolling ? "opacity-70" : ""}>
                  {currentDisplay}
                </span>
              ) : (
                <span className="text-gray-400">?</span>
              )}
            </div>
          )}

          {/* Roll Button and Apply Button */}
          <div className="flex gap-2 w-full">
            <button
              onClick={rollResourceDice}
              disabled={isRolling}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isRolling
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg"
              }`}
            >
              {isRolling ? "Rolling..." : "Roll Dice"}
            </button>
            {canApply && mode === "resource" && (
              <button
                onClick={handleApply}
                disabled={isRolling}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isRolling
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-md hover:shadow-lg"
                }`}
              >
                Apply {value !== null ? `+${value}` : ""}
              </button>
            )}
          </div>

          {/* Last Result */}
          {value !== null && !isRolling && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm text-gray-600">
                Last roll: <span className="font-semibold">{value}</span>
                {lastRollTurn && (
                  <span className="text-gray-500"> ({lastRollTurn})</span>
                )}
              </p>
              {hasSurvivalistTrait() && rollValues !== null && (
                <p className="text-xs text-gray-500">
                  Rolled: {rollValues[0]} and {rollValues[1]} (took{" "}
                  {Math.max(rollValues[0], rollValues[1])} + 1)
                </p>
              )}
            </div>
          )}

          {/* Reroll Button for Lucky trait */}
          {value !== null &&
            !isRolling &&
            (value === 0 || value === 1) &&
            hasLuckyTrait() &&
            !hasRerolledThisTurn && (
              <button
                onClick={rerollResourceDice}
                disabled={isRolling}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isRolling
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-orange-600 text-white hover:bg-orange-700 active:scale-95 shadow-md hover:shadow-lg"
                }`}
              >
                Reroll (Lucky)
              </button>
            )}
        </div>
      ) : mode === "d6" ? (
        <div className="flex flex-col items-center gap-4">
          {/* Number of Dice Selector */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Dice (1-20)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={numDice === null ? "" : numDice}
              onChange={(e) => {
                const val =
                  e.target.value === "" ? null : parseInt(e.target.value, 10);
                if (val === null || (!isNaN(val) && val >= 1 && val <= 20)) {
                  setNumDice(val);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {currentCommunity &&
              (() => {
                const memberTraits = getCommunityMemberTraits(
                  currentCommunity,
                  cardPlayerAssignments,
                  pinnedCards,
                  [] // individualTraitCards not needed for this check
                );
                const helplessCount = memberTraits.filter(
                  (trait) => trait.displayName === "Helpless"
                ).length;
                const baseMembers = currentCommunity.memberPlayerNames.length;
                const hasHelpless = helplessCount > 0;
                const hasAgriculture = hasAgricultureTrait();

                return (
                  <p className="text-xs text-gray-500 mt-1">
                    {baseMembers} member{baseMembers !== 1 ? "s" : ""}
                    {hasHelpless && (
                      <span className="text-green-600">
                        {" "}
                        + {helplessCount * 2} (Helpless)
                      </span>
                    )}
                    {hasAgriculture && (
                      <span className="text-green-600"> + 1 (Agriculture)</span>
                    )}
                  </p>
                );
              })()}
          </div>

          {/* Dice Display */}
          {currentD6Display && (
            <div className="w-full">
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {currentD6Display.map((dieValue, index) => (
                  <div
                    key={index}
                    className={`w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center text-2xl font-bold text-gray-800 shadow-md ${
                      isRollingD6 &&
                      (isRerolling ? rerollingIndices.has(index) : true)
                        ? "animate-spin opacity-70"
                        : ""
                    }`}
                  >
                    {dieValue}
                  </div>
                ))}
              </div>
              {!isRollingD6 && (
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-600">
                    Total:{" "}
                    <span className="text-sm font-semibold text-gray-900">
                      {d6Total}
                    </span>
                    {hasAgricultureTrait() &&
                      d6Total !== null &&
                      currentD6Display &&
                      numDice !== null && (
                        <>
                          {" "}
                          <span className="text-xs text-gray-500">
                            ({numDice - 1} base + 1 Agriculture)
                          </span>
                        </>
                      )}
                    {cutthroatBonus > 0 && (
                      <>
                        {" "}
                        <span className="text-green-600 font-semibold">
                          +{cutthroatBonus}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          (Cutthroat)
                        </span>
                      </>
                    )}
                    {survivalistBonus > 0 && (
                      <>
                        {" "}
                        <span className="text-green-600 font-semibold">
                          +{survivalistBonus}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          (Survivalist)
                        </span>
                      </>
                    )}
                    {d6TotalWithBonus !== null &&
                      (cutthroatBonus > 0 || survivalistBonus > 0) && (
                        <div className="mt-1">
                          <span className="font-semibold text-lg">
                            = {d6TotalWithBonus}
                          </span>
                        </div>
                      )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Roll Button, Apply Button, and Add to Community Button */}
          <div className="flex gap-2 w-full">
            <button
              onClick={rollD6Dice}
              disabled={isRollingD6 || !isValidDiceCount}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isRollingD6 || !isValidDiceCount
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg"
              }`}
            >
              {isRollingD6
                ? "Rolling..."
                : isValidDiceCount
                ? `Roll ${numDice} D6`
                : "Enter a number between 1 and 20"}
            </button>
            {canApply && mode === "d6" && (
              <button
                onClick={handleApply}
                disabled={isRollingD6}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isRollingD6
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-md hover:shadow-lg"
                }`}
              >
                Apply {d6TotalWithBonus !== null ? `+${d6TotalWithBonus}` : ""}
              </button>
            )}
          </div>

          {/* Reroll 1s Button - only for communities with Lucky members */}
          {d6Results && canRerollOnes && (
            <button
              onClick={rerollOnes}
              disabled={isRollingD6}
              className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-orange-600 text-white hover:bg-orange-700 active:scale-95 shadow-md hover:shadow-lg"
            >
              Reroll 1s (Lucky)
            </button>
          )}

          {/* Last Roll */}
          {d6TotalWithBonus !== null && !isRollingD6 && lastD6RollTurn && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm text-gray-600">
                Last roll:{" "}
                <span className="font-semibold">{d6TotalWithBonus}</span>
                <span className="text-gray-500"> ({lastD6RollTurn})</span>
              </p>
            </div>
          )}
        </div>
      ) : mode === "special" ? (
        <>
          {/* Special Roll Section */}
          <div className="flex flex-col items-center gap-4">
            {!currentCommunity ? (
              <p className="text-sm text-gray-500">
                Special dice rolls are only available during community turns.
              </p>
            ) : (
              <>
                {/* Special Dice Section */}
                {(hasBlacksmithTrait() ||
                  hasSawmillTrait() ||
                  hasSchoolhouseTrait()) && (
                  <div className="w-full space-y-4">
                    {/* Dice Displays */}
                    <div className="flex flex-col gap-6">
                      {/* Blacksmith Dice */}
                      {hasBlacksmithTrait() && (
                        <div className="flex flex-col items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            Blacksmith
                          </h4>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center text-xl font-bold text-gray-800 transition-all duration-75 ${
                                isRollingBlacksmith
                                  ? "animate-spin shadow-lg"
                                  : "shadow-md"
                              }`}
                            >
                              {blacksmithDisplayRoll !== null ? (
                                <span
                                  className={
                                    isRollingBlacksmith ? "opacity-70" : ""
                                  }
                                >
                                  {blacksmithDisplayRoll}
                                </span>
                              ) : blacksmithRoll !== null ? (
                                blacksmithRoll - 1
                              ) : (
                                <span className="text-gray-400">?</span>
                              )}
                            </div>
                            <div className="text-base font-bold text-gray-600">
                              +1
                            </div>
                            <div className="text-base font-bold text-gray-600">
                              =
                            </div>
                            <div
                              className={`w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 flex items-center justify-center text-xl font-bold text-gray-900 shadow-md ${
                                isRollingBlacksmith ? "opacity-70" : ""
                              }`}
                            >
                              {blacksmithRoll !== null ? blacksmithRoll : "?"}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sawmill Dice */}
                      {hasSawmillTrait() && (
                        <div className="flex flex-col items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            Sawmill
                          </h4>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center text-xl font-bold text-gray-800 transition-all duration-75 ${
                                isRollingSawmill
                                  ? "animate-spin shadow-lg"
                                  : "shadow-md"
                              }`}
                            >
                              {sawmillDisplayRoll !== null ? (
                                <span
                                  className={
                                    isRollingSawmill ? "opacity-70" : ""
                                  }
                                >
                                  {sawmillDisplayRoll}
                                </span>
                              ) : sawmillRoll !== null ? (
                                sawmillRoll - 1
                              ) : (
                                <span className="text-gray-400">?</span>
                              )}
                            </div>
                            <div className="text-base font-bold text-gray-600">
                              +1
                            </div>
                            <div className="text-base font-bold text-gray-600">
                              =
                            </div>
                            <div
                              className={`w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 flex items-center justify-center text-xl font-bold text-gray-900 shadow-md ${
                                isRollingSawmill ? "opacity-70" : ""
                              }`}
                            >
                              {sawmillRoll !== null ? sawmillRoll : "?"}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Schoolhouse Dice */}
                      {hasSchoolhouseTrait() && (
                        <div className="flex flex-col items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            Schoolhouse
                          </h4>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center text-xl font-bold text-gray-800 transition-all duration-75 ${
                                isRollingSchoolhouse
                                  ? "animate-spin shadow-lg"
                                  : "shadow-md"
                              }`}
                            >
                              {schoolhouseDisplayRoll !== null ? (
                                <span
                                  className={
                                    isRollingSchoolhouse ? "opacity-70" : ""
                                  }
                                >
                                  {schoolhouseDisplayRoll}
                                </span>
                              ) : schoolhouseRoll !== null ? (
                                schoolhouseRoll
                              ) : (
                                <span className="text-gray-400">?</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Combined Roll Button */}
                    <button
                      onClick={rollSpecialDice}
                      disabled={isRollingSpecial}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isRollingSpecial
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg"
                      }`}
                    >
                      {isRollingSpecial ? "Rolling..." : "Roll Special Dice"}
                    </button>

                    {/* Combined Result Display */}
                    {(totalSpecialReduction > 0 || schoolhouseRoll !== null) &&
                      !isRollingSpecial && (
                        <div className="text-center space-y-1">
                          {totalSpecialReduction > 0 && (
                            <p className="text-sm text-gray-600">
                              Total upkeep reduction:{" "}
                              <span className="font-semibold text-green-600">
                                -{totalSpecialReduction}
                              </span>
                            </p>
                          )}
                          {schoolhouseRoll !== null && (
                            <p className="text-sm text-gray-600">
                              Civilization Point cost reduction:{" "}
                              <span className="font-semibold text-green-600">
                                -{schoolhouseRoll}
                              </span>
                            </p>
                          )}
                          {(lastBlacksmithRollTurn ||
                            lastSawmillRollTurn ||
                            lastSchoolhouseRollTurn) && (
                            <p className="text-xs text-gray-500 mt-1">
                              (
                              {lastBlacksmithRollTurn ||
                                lastSawmillRollTurn ||
                                lastSchoolhouseRollTurn}
                              )
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                )}

                {/* No special traits message */}
                {!hasBlacksmithTrait() &&
                  !hasSawmillTrait() &&
                  !hasSchoolhouseTrait() && (
                    <p className="text-sm text-gray-500">
                      This community has no special dice rolls available.
                    </p>
                  )}
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
