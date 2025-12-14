"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card as CardType } from "@/types/card";
import { PinnedCardWithDeck } from "@/types/gameState";
import { calculateCommunityUpkeepCost } from "@/utils/communityTraitEffects";

interface Community {
  id: string;
  name: string;
  resources: number;
  memberPlayerNames: string[];
}

interface PlayerResource {
  name: string;
  resources: number;
}

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    memberPlayerNames: string[],
    optOutPlayers: string[],
    waivedCostPlayers: string[]
  ) => void;
  availablePlayers: string[];
  existingCommunities: Community[];
  editingCommunity?: Community | null;
  playerResources: PlayerResource[];
  communityCostPerMember: number;
  cardPlayerAssignments?: Map<string, string>;
  pinnedCards?: PinnedCardWithDeck[];
  individualTraitCards?: CardType[];
  turnAssist?: boolean;
}

export default function CommunityModal({
  isOpen,
  onClose,
  onSubmit,
  availablePlayers,
  existingCommunities,
  editingCommunity,
  playerResources,
  communityCostPerMember,
  cardPlayerAssignments = new Map(),
  pinnedCards = [],
  individualTraitCards = [],
  turnAssist = true,
}: CommunityModalProps) {
  const [name, setName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [optOutPlayers, setOptOutPlayers] = useState<Set<string>>(new Set());
  const [waivedCostPlayers, setWaivedCostPlayers] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  // Check if a player has the Paranoid trait
  const hasParanoidTrait = useCallback(
    (playerName: string): boolean => {
      return pinnedCards
        .filter((card) => card.deckTitle === "Individual Traits")
        .some((card) => {
          const cardKey = card.pinnedId;
          return (
            cardPlayerAssignments.get(cardKey) === playerName &&
            card.displayName === "Paranoid"
          );
        });
    },
    [pinnedCards, cardPlayerAssignments]
  );

  // Check if a player has the Charismatic trait
  const hasCharismaticTrait = useCallback(
    (playerName: string): boolean => {
      return pinnedCards
        .filter((card) => card.deckTitle === "Individual Traits")
        .some((card) => {
          const cardKey = card.pinnedId;
          return (
            cardPlayerAssignments.get(cardKey) === playerName &&
            card.displayName === "Charasmatic"
          );
        });
    },
    [pinnedCards, cardPlayerAssignments]
  );

  useEffect(() => {
    if (isOpen) {
      if (editingCommunity) {
        setName(editingCommunity.name);
        const members = [...editingCommunity.memberPlayerNames];
        setSelectedPlayers(members);
        // Automatically opt out Paranoid players
        const paranoidOptOuts = new Set<string>();
        members.forEach((playerName) => {
          if (hasParanoidTrait(playerName)) {
            paranoidOptOuts.add(playerName);
          }
        });
        setOptOutPlayers(paranoidOptOuts);
        // Automatically waive costs if any member has Charismatic
        const hasCharismaticMember = members.some((playerName) =>
          hasCharismaticTrait(playerName)
        );
        if (hasCharismaticMember) {
          setWaivedCostPlayers(new Set(members));
        } else {
          setWaivedCostPlayers(new Set());
        }
      } else {
        const nextNumber =
          existingCommunities.length > 0
            ? Math.max(
                ...existingCommunities.map((c) => {
                  const match = c.name.match(/Community (\d+)/);
                  return match ? parseInt(match[1]) : 0;
                })
              ) + 1
            : 1;
        setName(`Community ${nextNumber}`);
        setSelectedPlayers([]);
        setOptOutPlayers(new Set());
        setWaivedCostPlayers(new Set());
      }
      setError(null);
    }
  }, [
    isOpen,
    editingCommunity,
    existingCommunities,
    pinnedCards,
    cardPlayerAssignments,
    hasParanoidTrait,
    hasCharismaticTrait,
  ]);

  // Automatically waive costs for all players if any selected player has Charismatic trait
  useEffect(() => {
    // Skip if modal is not open or if we're in the initial setup phase
    if (!isOpen) return;

    if (selectedPlayers.length > 0) {
      const hasCharismaticMember = selectedPlayers.some((playerName) =>
        hasCharismaticTrait(playerName)
      );
      if (hasCharismaticMember) {
        // If any member has Charismatic, waive cost for all selected players
        setWaivedCostPlayers(new Set(selectedPlayers));
      } else {
        // If no Charismatic member and we're creating (not editing), clear waived costs
        // When editing, we preserve the existing waived cost state unless Charismatic applies
        if (!editingCommunity) {
          setWaivedCostPlayers(new Set());
        }
      }
    } else {
      // No players selected, clear waived costs only when creating
      if (!editingCommunity) {
        setWaivedCostPlayers(new Set());
      }
    }
  }, [selectedPlayers, hasCharismaticTrait, editingCommunity, isOpen]);

  const handlePlayerToggle = (playerName: string) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p !== playerName));
      // Remove from opt-out and waived cost sets if deselected
      setOptOutPlayers((prev) => {
        const updated = new Set(prev);
        updated.delete(playerName);
        return updated;
      });
      setWaivedCostPlayers((prev) => {
        const updated = new Set(prev);
        updated.delete(playerName);
        return updated;
      });
    } else {
      setSelectedPlayers([...selectedPlayers, playerName]);
      // Automatically opt out players with Paranoid trait
      if (hasParanoidTrait(playerName)) {
        setOptOutPlayers((prev) => {
          const updated = new Set(prev);
          updated.add(playerName);
          return updated;
        });
      }
    }
    setError(null);
  };

  const handleOptOutToggle = (playerName: string) => {
    setOptOutPlayers((prev) => {
      const updated = new Set(prev);
      if (updated.has(playerName)) {
        updated.delete(playerName);
      } else {
        updated.add(playerName);
      }
      return updated;
    });
  };

  const handleWaiveCostToggle = (playerName: string) => {
    setWaivedCostPlayers((prev) => {
      const updated = new Set(prev);
      if (updated.has(playerName)) {
        updated.delete(playerName);
      } else {
        updated.add(playerName);
      }
      return updated;
    });
  };

  const getPlayerResource = (playerName: string): number => {
    const player = playerResources.find((p) => p.name === playerName);
    return player?.resources ?? 0;
  };

  const canPlayerJoin = (playerName: string): boolean => {
    // If cost is waived, player can always join
    if (waivedCostPlayers.has(playerName)) {
      return true;
    }
    return getPlayerResource(playerName) >= communityCostPerMember;
  };

  const validateForm = (): { isValid: boolean; error: string | null } => {
    if (name.trim() === "") {
      return { isValid: false, error: "Community name is required" };
    }

    if (selectedPlayers.length < 2) {
      return {
        isValid: false,
        error: "A community must have at least 2 members",
      };
    }

    // Check if any selected player is already in another community
    const playersInOtherCommunities = selectedPlayers.filter((playerName) => {
      if (editingCommunity) {
        // When editing, exclude current community
        return existingCommunities.some(
          (c) =>
            c.id !== editingCommunity.id &&
            c.memberPlayerNames.includes(playerName)
        );
      } else {
        return existingCommunities.some((c) =>
          c.memberPlayerNames.includes(playerName)
        );
      }
    });

    if (playersInOtherCommunities.length > 0) {
      return {
        isValid: false,
        error: `The following players are already in another community: ${playersInOtherCommunities.join(
          ", "
        )}`,
      };
    }

    // Check if all selected players have sufficient resources OR have their cost waived
    // When editing, existing members don't need to pay resources again
    const existingMemberNames = editingCommunity
      ? editingCommunity.memberPlayerNames
      : [];

    const playersWithInsufficientResources = selectedPlayers.filter(
      (playerName) => {
        // Existing members don't need to pay when editing
        if (editingCommunity && existingMemberNames.includes(playerName)) {
          return false;
        }
        const resource = getPlayerResource(playerName);
        const isWaived = waivedCostPlayers.has(playerName);
        return resource < communityCostPerMember && !isWaived;
      }
    );

    if (playersWithInsufficientResources.length > 0) {
      return {
        isValid: false,
        error: `The following players have insufficient resources (need ${communityCostPerMember}): ${playersWithInsufficientResources.join(
          ", "
        )}. Please waive their cost to allow them to join.`,
      };
    }

    return { isValid: true, error: null };
  };

  // Memoize validation result to avoid recalculating on every render
  const validation = useMemo(
    () => validateForm(),
    [
      name,
      selectedPlayers,
      editingCommunity,
      existingCommunities,
      waivedCostPlayers,
      playerResources,
      communityCostPerMember,
    ]
  );

  const handleSubmit = () => {
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    onSubmit(
      name.trim(),
      selectedPlayers,
      Array.from(optOutPlayers),
      Array.from(waivedCostPlayers)
    );
    onClose();
  };

  if (!isOpen) return null;

  const getPlayerCommunity = (playerName: string): Community | null => {
    if (editingCommunity) {
      return (
        existingCommunities.find(
          (c) =>
            c.id !== editingCommunity.id &&
            c.memberPlayerNames.includes(playerName)
        ) || null
      );
    }
    return (
      existingCommunities.find((c) =>
        c.memberPlayerNames.includes(playerName)
      ) || null
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingCommunity ? "Edit Community" : "Create Community"}
          </h2>

          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Community name"
            />
          </div>

          {/* Player Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Members (minimum 2, cost: {communityCostPerMember} per member)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
              {availablePlayers.length === 0 ? (
                <p className="text-sm text-gray-500">No players available</p>
              ) : (
                availablePlayers.map((playerName) => {
                  const playerCommunity = getPlayerCommunity(playerName);
                  const isSelected = selectedPlayers.includes(playerName);
                  const playerResource = getPlayerResource(playerName);
                  // Existing members don't need to pay when editing
                  const isExistingMember = editingCommunity
                    ? editingCommunity.memberPlayerNames.includes(playerName)
                    : false;
                  const hasInsufficientResources =
                    !isExistingMember &&
                    playerResource < communityCostPerMember;
                  const isCostWaived = waivedCostPlayers.has(playerName);
                  const isDisabled =
                    !!playerCommunity &&
                    playerCommunity.id !== editingCommunity?.id;

                  return (
                    <div key={playerName}>
                      <label
                        className={`flex items-center gap-2 p-2 rounded ${
                          isDisabled
                            ? "bg-gray-100 opacity-50 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-50 cursor-pointer"
                            : "hover:bg-gray-50 cursor-pointer"
                        }`}
                        title={
                          hasInsufficientResources && !isCostWaived
                            ? `Insufficient resources (need ${communityCostPerMember}, has ${playerResource}). Waive cost to allow joining.`
                            : undefined
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handlePlayerToggle(playerName)}
                          disabled={isDisabled}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900 flex-1">
                          {playerName}
                          {!isExistingMember &&
                            ` (${playerResource} resources)`}
                        </span>
                        {playerCommunity && (
                          <span className="text-xs text-gray-500">
                            (in {playerCommunity.name})
                          </span>
                        )}
                        {hasInsufficientResources &&
                          !isCostWaived &&
                          !playerCommunity &&
                          !isExistingMember && (
                            <span className="text-xs text-red-500">
                              (insufficient - waive cost to join)
                            </span>
                          )}
                        {isCostWaived && !isExistingMember && (
                          <span className="text-xs text-green-600">
                            (cost waived)
                          </span>
                        )}
                      </label>
                      {/* Options for selected players */}
                      {isSelected && !isDisabled && !isExistingMember && (
                        <div className="ml-8 mb-1 space-y-1">
                          {!turnAssist && (
                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={waivedCostPlayers.has(playerName)}
                                onChange={() =>
                                  handleWaiveCostToggle(playerName)
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>Waive cost</span>
                            </label>
                          )}
                          {!turnAssist && (
                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={optOutPlayers.has(playerName)}
                                onChange={() => handleOptOutToggle(playerName)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>Opt out of resource transfer</span>
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {selectedPlayers.length} player
              {selectedPlayers.length !== 1 ? "s" : ""}
              {selectedPlayers.length > 0 && (
                <span className="ml-2">
                  • Total cost:{" "}
                  {(() => {
                    // When editing, existing members don't pay
                    const existingMemberNames = editingCommunity
                      ? editingCommunity.memberPlayerNames
                      : [];
                    const newMembers = editingCommunity
                      ? selectedPlayers.filter(
                          (p) => !existingMemberNames.includes(p)
                        )
                      : selectedPlayers;
                    const newMembersPaying = newMembers.filter(
                      (p) => !waivedCostPlayers.has(p)
                    );
                    return newMembersPaying.length * communityCostPerMember;
                  })()}
                  {waivedCostPlayers.size > 0 && (
                    <span className="text-green-600">
                      {" "}
                      ({waivedCostPlayers.size} waived)
                    </span>
                  )}
                  {editingCommunity &&
                    editingCommunity.memberPlayerNames.length > 0 && (
                      <span className="text-gray-400">
                        {" "}
                        ({editingCommunity.memberPlayerNames.length} existing
                        members free)
                      </span>
                    )}
                </span>
              )}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-between items-center">
            {/* Preview section - only show when creating (not editing) */}
            {!editingCommunity && selectedPlayers.length >= 2 && (
              <div className="flex flex-col gap-1 text-xs text-gray-600">
                {(() => {
                  // Calculate total resources transferred
                  let totalResources = 0;

                  // Check if any selected player has Charismatic trait (for cost waiver)
                  const hasCharismaticMember = selectedPlayers.some(
                    (playerName) => hasCharismaticTrait(playerName)
                  );

                  selectedPlayers.forEach((playerName) => {
                    const playerResource = getPlayerResource(playerName);
                    // Check if cost is waived: either explicitly waived OR any member has Charismatic
                    const isWaived =
                      waivedCostPlayers.has(playerName) || hasCharismaticMember;
                    const isOptedOut = optOutPlayers.has(playerName);

                    // Calculate resources after cost (if not waived)
                    const resourcesAfterCost = isWaived
                      ? playerResource
                      : Math.max(0, playerResource - communityCostPerMember);

                    // Add to total if not opted out
                    if (!isOptedOut) {
                      totalResources += resourcesAfterCost;
                    }
                  });
                  // Calculate upkeep cost considering individual traits
                  const tempCommunity: Community = {
                    id: "temp",
                    name: "",
                    resources: 0,
                    memberPlayerNames: selectedPlayers,
                  };
                  const firstUpkeepCost = calculateCommunityUpkeepCost(
                    tempCommunity,
                    communityCostPerMember,
                    cardPlayerAssignments,
                    pinnedCards,
                    individualTraitCards,
                    0, // No Blacksmith reduction for new communities
                    0 // No Sawmill reduction for new communities
                  );
                  const upkeepExceedsResources =
                    firstUpkeepCost > totalResources;

                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Starting Resources:</span>
                        <span className="font-bold text-gray-900">
                          {totalResources}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">First Upkeep:</span>
                        <span className="font-bold text-orange-600">
                          {firstUpkeepCost}
                        </span>
                        {upkeepExceedsResources && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-red-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <title>
                              Warning: Upkeep cost exceeds starting resources
                            </title>
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            {editingCommunity && <div></div>}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!validation.isValid}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  validation.isValid
                    ? "text-white bg-blue-600 hover:bg-blue-700"
                    : "text-gray-400 bg-gray-200 cursor-not-allowed"
                }`}
              >
                {editingCommunity ? "Save Changes" : "Create Community"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
