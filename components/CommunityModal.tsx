"use client";

import { useState, useEffect } from "react";

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
  onSubmit: (name: string, memberPlayerNames: string[], optOutPlayers: string[]) => void;
  availablePlayers: string[];
  existingCommunities: Community[];
  editingCommunity?: Community | null;
  playerResources: PlayerResource[];
  communityCostPerMember: number;
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
}: CommunityModalProps) {
  const [name, setName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [optOutPlayers, setOptOutPlayers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingCommunity) {
        setName(editingCommunity.name);
        setSelectedPlayers([...editingCommunity.memberPlayerNames]);
        setOptOutPlayers(new Set());
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
      }
      setError(null);
    }
  }, [isOpen, editingCommunity, existingCommunities]);

  const handlePlayerToggle = (playerName: string) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p !== playerName));
      // Remove from opt-out set if deselected
      setOptOutPlayers((prev) => {
        const updated = new Set(prev);
        updated.delete(playerName);
        return updated;
      });
    } else {
      setSelectedPlayers([...selectedPlayers, playerName]);
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

  const getPlayerResource = (playerName: string): number => {
    const player = playerResources.find((p) => p.name === playerName);
    return player?.resources ?? 0;
  };

  const canPlayerJoin = (playerName: string): boolean => {
    return getPlayerResource(playerName) >= communityCostPerMember;
  };

  const handleSubmit = () => {
    if (name.trim() === "") {
      setError("Community name is required");
      return;
    }

    if (selectedPlayers.length < 2) {
      setError("A community must have at least 2 members");
      return;
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
      setError(
        `The following players are already in another community: ${playersInOtherCommunities.join(
          ", "
        )}`
      );
      return;
    }

    // Check if all selected players have sufficient resources
    const playersWithInsufficientResources = selectedPlayers.filter(
      (playerName) => !canPlayerJoin(playerName)
    );

    if (playersWithInsufficientResources.length > 0) {
      setError(
        `The following players have insufficient resources (need ${communityCostPerMember}): ${playersWithInsufficientResources.join(
          ", "
        )}`
      );
      return;
    }

    onSubmit(name.trim(), selectedPlayers, Array.from(optOutPlayers));
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
                  const hasInsufficientResources = !canPlayerJoin(playerName);
                  const isDisabled =
                    (!!playerCommunity &&
                      playerCommunity.id !== editingCommunity?.id) ||
                    hasInsufficientResources;

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
                          hasInsufficientResources
                            ? `Insufficient resources (need ${communityCostPerMember}, has ${playerResource})`
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
                          {playerName} ({playerResource} resources)
                        </span>
                        {playerCommunity && (
                          <span className="text-xs text-gray-500">
                            (in {playerCommunity.name})
                          </span>
                        )}
                        {hasInsufficientResources && !playerCommunity && (
                          <span className="text-xs text-red-500">
                            (insufficient)
                          </span>
                        )}
                      </label>
                      {/* Opt-out checkbox for selected players */}
                      {isSelected && !isDisabled && (
                        <div className="ml-8 mb-1">
                          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={optOutPlayers.has(playerName)}
                              onChange={() => handleOptOutToggle(playerName)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Opt out of resource transfer</span>
                          </label>
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
                  • Total cost: {selectedPlayers.length * communityCostPerMember}
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
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingCommunity ? "Save Changes" : "Create Community"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
