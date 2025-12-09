"use client";

import { useState } from "react";
import CommunityModal from "./CommunityModal";
import { PinnedCardWithDeck } from "@/types/gameState";

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

interface CommunitiesTrackerProps {
  communities: Community[];
  availablePlayers: string[];
  onResourceChange: (communityId: string, newValue: number) => void;
  onUpdateCommunity: (communityId: string, updates: Partial<Community>, optOutPlayers?: string[], waivedCostPlayers?: string[]) => void;
  onDisbandCommunity: (communityId: string) => void;
  onCreateCommunity: (name: string, memberPlayerNames: string[], optOutPlayers: string[], waivedCostPlayers: string[]) => void;
  playerResources: PlayerResource[];
  communityCostPerMember: number;
  currentTurnIndex: number;
  turnOrder: (string | "creation")[];
  pinnedCards: PinnedCardWithDeck[];
  communityTraitAssignments: Map<string, string>;
}

export default function CommunitiesTracker({
  communities,
  availablePlayers,
  onResourceChange,
  onUpdateCommunity,
  onDisbandCommunity,
  onCreateCommunity,
  playerResources,
  communityCostPerMember,
  currentTurnIndex,
  turnOrder,
  pinnedCards,
  communityTraitAssignments,
}: CommunitiesTrackerProps) {
  const [editingCommunityId, setEditingCommunityId] = useState<string | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [adjustmentValues, setAdjustmentValues] = useState<Map<string, string>>(
    new Map()
  );

  const handleIncrement = (communityId: string) => {
    const community = communities.find((c) => c.id === communityId);
    if (community) {
      onResourceChange(communityId, community.resources + 1);
    }
  };

  const handleDecrement = (communityId: string) => {
    const community = communities.find((c) => c.id === communityId);
    if (community) {
      onResourceChange(communityId, Math.max(0, community.resources - 1));
    }
  };

  const handleInputChange = (communityId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onResourceChange(communityId, numValue);
    } else if (value === "" || value === "-") {
      onResourceChange(communityId, 0);
    }
  };

  const handleReset = (communityId: string) => {
    onResourceChange(communityId, 0);
  };

  const handleUpkeep = (communityId: string) => {
    const community = communities.find((c) => c.id === communityId);
    if (community) {
      const upkeepCost = community.memberPlayerNames.length * communityCostPerMember;
      const newResources = Math.max(0, community.resources - upkeepCost);
      onResourceChange(communityId, newResources);
    }
  };

  const handleAdjustmentChange = (communityId: string, value: string) => {
    setAdjustmentValues((prev) => {
      const newMap = new Map(prev);
      if (value === "" || value === "-") {
        newMap.set(communityId, value);
      } else {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
          newMap.set(communityId, value);
        }
      }
      return newMap;
    });
  };

  const handleApplyAdjustment = (communityId: string) => {
    const adjustmentValue = adjustmentValues.get(communityId);
    if (adjustmentValue === undefined || adjustmentValue === "" || adjustmentValue === "-") {
      return;
    }
    const numValue = parseInt(adjustmentValue, 10);
    if (!isNaN(numValue)) {
      const community = communities.find((c) => c.id === communityId);
      if (community) {
        const newResources = Math.max(0, community.resources + numValue);
        onResourceChange(communityId, newResources);
        // Clear the adjustment value after applying
        setAdjustmentValues((prev) => {
          const newMap = new Map(prev);
          newMap.delete(communityId);
          return newMap;
        });
      }
    }
  };

  const handleEdit = (communityId: string) => {
    setEditingCommunityId(communityId);
    setShowCreateModal(true);
  };

  const handleCreate = () => {
    setEditingCommunityId(null);
    setShowCreateModal(true);
  };

  const handleModalSubmit = (name: string, memberPlayerNames: string[], optOutPlayers: string[], waivedCostPlayers: string[]) => {
    if (editingCommunityId) {
      onUpdateCommunity(editingCommunityId, {
        name,
        memberPlayerNames,
      }, optOutPlayers, waivedCostPlayers);
    } else {
      onCreateCommunity(name, memberPlayerNames, optOutPlayers, waivedCostPlayers);
    }
    setShowCreateModal(false);
    setEditingCommunityId(null);
  };

  const editingCommunity = editingCommunityId
    ? communities.find((c) => c.id === editingCommunityId)
    : null;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-700">Communities</h3>
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add
          </button>
        </div>

        {communities.length === 0 ? (
          <p className="text-sm text-gray-500">
            No communities yet. Create one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {communities.map((community) => {
              const isCurrentTurn = turnOrder.length > 0 && turnOrder[currentTurnIndex] === community.id;
              return (
              <div
                key={community.id}
                className={`flex flex-col gap-2 p-3 rounded-lg border-2 transition-colors ${
                  isCurrentTurn
                    ? "border-yellow-400 bg-yellow-50"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 break-words flex-1">
                    {community.name}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(community.id)}
                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      aria-label={`Edit ${community.name}`}
                      title="Edit community"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleReset(community.id)}
                      disabled={community.resources === 0}
                      className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                      aria-label={`Reset resources for ${community.name}`}
                      title="Reset to 0"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => onDisbandCommunity(community.id)}
                      className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                      aria-label={`Disband ${community.name}`}
                      title="Disband community"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Members List */}
                <div className="flex flex-wrap gap-1">
                  {community.memberPlayerNames.map((playerName) => (
                    <span
                      key={playerName}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {playerName}
                    </span>
                  ))}
                </div>

                {/* Resource Counter */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 justify-end flex-nowrap">
                    <button
                      onClick={() => handleDecrement(community.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation shrink-0"
                      aria-label={`Decrease resources for ${community.name}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={community.resources}
                      onChange={(e) =>
                        handleInputChange(community.id, e.target.value)
                      }
                      className="w-14 px-1 py-1 text-center text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shrink-0"
                      aria-label={`Resources for ${community.name}`}
                    />
                    <button
                      onClick={() => handleIncrement(community.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation shrink-0"
                      aria-label={`Increase resources for ${community.name}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <div className="flex items-center gap-1 ml-1 shrink-0">
                      <input
                        type="number"
                        placeholder="±"
                        value={adjustmentValues.get(community.id) || ""}
                        onChange={(e) =>
                          handleAdjustmentChange(community.id, e.target.value)
                        }
                        className="w-14 px-1 py-1 text-center text-xs text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        aria-label={`Adjustment value for ${community.name}`}
                      />
                      <button
                        onClick={() => handleApplyAdjustment(community.id)}
                        disabled={
                          !adjustmentValues.get(community.id) ||
                          adjustmentValues.get(community.id) === "" ||
                          adjustmentValues.get(community.id) === "-"
                        }
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors touch-manipulation whitespace-nowrap ${
                          !adjustmentValues.get(community.id) ||
                          adjustmentValues.get(community.id) === "" ||
                          adjustmentValues.get(community.id) === "-"
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                        }`}
                        aria-label={`Apply adjustment for ${community.name}`}
                        title="Apply adjustment"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const upkeepCost = community.memberPlayerNames.length * communityCostPerMember;
                    const wouldGoBelowOne = community.resources - upkeepCost < 1;
                    return (
                      <button
                        onClick={() => handleUpkeep(community.id)}
                        disabled={wouldGoBelowOne}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors touch-manipulation ${
                          wouldGoBelowOne
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800"
                        }`}
                        aria-label={`Pay upkeep for ${community.name}`}
                        title={wouldGoBelowOne ? "Insufficient resources for upkeep" : `Pay upkeep: ${upkeepCost} resources`}
                      >
                        Upkeep ({upkeepCost})
                      </button>
                    );
                  })()}
                </div>

                {/* Assigned Community Traits */}
                {(() => {
                  const assignedTraits = pinnedCards
                    .filter((card) => card.deckTitle === "Community Traits")
                    .filter((card) => {
                      const cardKey = card.pinnedId;
                      return communityTraitAssignments.get(cardKey) === community.id;
                    });

                  return assignedTraits.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {assignedTraits.map((trait, traitIndex) => (
                        <span
                          key={`${community.id}-${trait.id}-${trait.deckTitle}-${traitIndex}`}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                          title={trait.displayName}
                        >
                          {trait.displayName}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CommunityModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCommunityId(null);
          }}
          onSubmit={handleModalSubmit}
          availablePlayers={availablePlayers}
          existingCommunities={communities}
          editingCommunity={editingCommunity}
          playerResources={playerResources}
          communityCostPerMember={communityCostPerMember}
        />
      )}
    </>
  );
}
