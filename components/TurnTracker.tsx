"use client";

import { Community } from "@/types/gameState";

interface TurnTrackerProps {
  currentTurnIndex: number;
  turnOrder: (string | "creation")[];
  onTurnIncrement: () => void;
  onTurnDecrement: () => void;
  onTurnReset: () => void;
  communities: Community[];
}

export default function TurnTracker({
  currentTurnIndex,
  turnOrder,
  onTurnIncrement,
  onTurnDecrement,
  onTurnReset,
  communities,
}: TurnTrackerProps) {
  const getDisplayName = (): string => {
    if (turnOrder.length === 0) {
      return "No turns";
    }
    
    const currentTurn = turnOrder[currentTurnIndex];
    
    if (currentTurn === "creation") {
      return "Creation";
    }
    
    // Check if it's a community ID
    const community = communities.find((c) => c.id === currentTurn);
    if (community) {
      return community.name;
    }
    
    // Otherwise it's a player name
    return currentTurn;
  };

  const isEmpty = turnOrder.length === 0;
  const displayName = getDisplayName();

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Turn</h3>
        <button
          onClick={onTurnReset}
          disabled={currentTurnIndex === 0 || isEmpty}
          className="px-2 py-1 text-xs font-medium text-gray-600 bg-white rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          aria-label="Reset turn tracker"
          title="Reset to first turn"
        >
          Reset
        </button>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onTurnDecrement}
          disabled={isEmpty}
          className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200"
          aria-label="Previous turn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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
        <div className="text-lg font-semibold text-gray-900 min-w-[120px] text-center px-2">
          {displayName}
        </div>
        <button
          onClick={onTurnIncrement}
          disabled={isEmpty}
          className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200"
          aria-label="Next turn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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
}

