"use client";

import { useState } from "react";
import CommunitiesTracker from "./CommunitiesTracker";
import { PinnedCardWithDeck } from "@/types/gameState";

interface Player {
  name: string;
  resources: number;
}

interface Community {
  id: string;
  name: string;
  resources: number;
  memberPlayerNames: string[];
}

interface PlayerTrackerProps {
  players: Player[];
  onResourceChange: (playerIndex: number, newValue: number) => void;
  communities: Community[];
  availablePlayers: string[];
  onCommunityResourceChange: (communityId: string, newValue: number) => void;
  onUpdateCommunity: (communityId: string, updates: Partial<Community>) => void;
  onDisbandCommunity: (communityId: string) => void;
  onCreateCommunity: (
    name: string,
    memberPlayerNames: string[],
    optOutPlayers: string[],
    waivedCostPlayers: string[]
  ) => void;
  getPlayerCommunity: (playerName: string) => Community | null;
  playerResources: Player[];
  communityCostPerMember: number;
  roundValue: number;
  soloRounds: number;
  missingTurnPlayers: Set<string>;
  onToggleMissingTurn: (playerName: string) => void;
  missingResourcesPlayers: Set<string>;
  onToggleMissingResources: (playerName: string) => void;
  extraEventCardPlayers: Set<string>;
  onToggleExtraEventCard: (playerName: string) => void;
  wandererPlayers: Set<string>;
  currentTurnIndex: number;
  turnOrder: (string | "creation")[];
  pinnedCards: PinnedCardWithDeck[];
  cardPlayerAssignments: Map<string, string>;
  communityTraitAssignments: Map<string, string>;
}

export default function PlayerTracker({
  players,
  onResourceChange,
  communities,
  availablePlayers,
  onCommunityResourceChange,
  onUpdateCommunity,
  onDisbandCommunity,
  onCreateCommunity,
  getPlayerCommunity,
  playerResources,
  communityCostPerMember,
  roundValue,
  soloRounds,
  missingTurnPlayers,
  onToggleMissingTurn,
  missingResourcesPlayers,
  onToggleMissingResources,
  extraEventCardPlayers,
  onToggleExtraEventCard,
  wandererPlayers,
  currentTurnIndex,
  turnOrder,
  pinnedCards,
  cardPlayerAssignments,
  communityTraitAssignments,
}: PlayerTrackerProps) {
  const [activeTab, setActiveTab] = useState<"players" | "communities">(
    "players"
  );

  const handleIncrement = (index: number) => {
    onResourceChange(index, players[index].resources + 1);
  };

  const handleDecrement = (index: number) => {
    onResourceChange(index, Math.max(0, players[index].resources - 1));
  };

  const handleInputChange = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      onResourceChange(index, numValue);
    } else if (value === "" || value === "-") {
      // Allow empty or minus sign for user input
      onResourceChange(index, 0);
    }
  };

  const handleReset = (index: number) => {
    onResourceChange(index, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "players"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {activeTab === "players" ? (
            "Players"
          ) : (
            <span className="text-lg font-bold">P</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("communities")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "communities"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {activeTab === "communities" ? (
            "Communities"
          ) : (
            <span className="text-lg font-bold">C</span>
          )}
        </button>
      </div>

      {/* Players Tab */}
      {activeTab === "players" && (
        <div>
          {players.length === 0 ? (
            <p className="text-sm text-gray-500">
              No players configured. Add players in settings.json
            </p>
          ) : (
            <div className="space-y-3">
              {players.map((player, index) => {
                const playerCommunity = getPlayerCommunity(player.name);
                const isCurrentTurn =
                  turnOrder.length > 0 &&
                  turnOrder[currentTurnIndex] === player.name;

                // Get assigned Individual Traits for this player
                const assignedTraits = pinnedCards
                  .filter((card) => card.deckTitle === "Individual Traits")
                  .filter((card) => {
                    const cardKey = card.pinnedId;
                    return cardPlayerAssignments.get(cardKey) === player.name;
                  });

                return (
                  <div
                    key={index}
                    className={`flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border-2 transition-colors ${
                      isCurrentTurn
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {player.name}
                        </p>
                        {assignedTraits.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assignedTraits.map((trait, traitIndex) => (
                              <span
                                key={`${player.name}-${trait.id}-${trait.deckTitle}-${traitIndex}`}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                title={trait.displayName}
                              >
                                {trait.displayName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleReset(index)}
                        disabled={player.resources === 0}
                        className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                        aria-label={`Reset resources for ${player.name}`}
                        title="Reset to 0"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Show community membership and badges */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {playerCommunity && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {playerCommunity.name}
                        </span>
                      )}
                      {/* Missing Turn Badge */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMissingTurn(player.name);
                        }}
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                          missingTurnPlayers.has(player.name)
                            ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        title={
                          missingTurnPlayers.has(player.name)
                            ? "Click to remove 'Missing Turn' badge"
                            : "Click to mark as missing turn"
                        }
                      >
                        ⏰ Skip
                      </button>
                      {/* Missing Resources Badge */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMissingResources(player.name);
                        }}
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                          missingResourcesPlayers.has(player.name)
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        title={
                          missingResourcesPlayers.has(player.name)
                            ? "Click to remove 'Missing Resources' badge"
                            : "Click to mark as missing resources"
                        }
                      >
                        💰 No $
                      </button>
                      {/* Extra Event Card Badge */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExtraEventCard(player.name);
                        }}
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                          extraEventCardPlayers.has(player.name)
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        title={
                          extraEventCardPlayers.has(player.name)
                            ? "Click to remove 'Extra Event Card' badge"
                            : "Click to mark as having extra event card"
                        }
                      >
                        🎴 Extra
                      </button>
                      {/* Wanderer Badge */}
                      {wandererPlayers.has(player.name) && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                          title="Wanderer: All other players are in communities"
                        >
                          🚶 Wanderer
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleDecrement(index)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation"
                        aria-label={`Decrease resources for ${player.name}`}
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
                        value={player.resources}
                        onChange={(e) =>
                          handleInputChange(index, e.target.value)
                        }
                        className="w-16 px-2 py-1 text-center text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        aria-label={`Resources for ${player.name}`}
                      />
                      <button
                        onClick={() => handleIncrement(index)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation"
                        aria-label={`Increase resources for ${player.name}`}
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Communities Tab */}
      {activeTab === "communities" && (
        <CommunitiesTracker
          communities={communities}
          availablePlayers={availablePlayers}
          onResourceChange={onCommunityResourceChange}
          onUpdateCommunity={onUpdateCommunity}
          onDisbandCommunity={onDisbandCommunity}
          onCreateCommunity={onCreateCommunity}
          playerResources={playerResources}
          communityCostPerMember={communityCostPerMember}
          currentTurnIndex={currentTurnIndex}
          turnOrder={turnOrder}
          pinnedCards={pinnedCards}
          communityTraitAssignments={communityTraitAssignments}
        />
      )}
    </div>
  );
}
