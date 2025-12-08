"use client";

import GameCounter from "./GameCounter";

interface CountersContentProps {
  roundValue: number;
  onRoundIncrement: () => void;
  onRoundDecrement: () => void;
  onRoundReset: () => void;
  extinctionValue: number;
  civilizationValue: number;
  extinctionMax: number;
  civilizationMax: number;
  onExtinctionIncrement: () => void;
  onExtinctionDecrement: () => void;
  onExtinctionReset: () => void;
  onCivilizationIncrement: () => void;
  onCivilizationDecrement: () => void;
  onCivilizationReset: () => void;
}

export default function CountersContent({
  roundValue,
  onRoundIncrement,
  onRoundDecrement,
  onRoundReset,
  extinctionValue,
  civilizationValue,
  extinctionMax,
  civilizationMax,
  onExtinctionIncrement,
  onExtinctionDecrement,
  onExtinctionReset,
  onCivilizationIncrement,
  onCivilizationDecrement,
  onCivilizationReset,
}: CountersContentProps) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Game Counters</h2>
      </div>

      <div className="space-y-4">
        {/* Round Counter */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Round</h3>
            <button
              onClick={onRoundReset}
              disabled={roundValue === 0}
              className="px-2 py-1 text-xs font-medium text-gray-600 bg-white rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              aria-label="Reset round counter"
              title="Reset to 0"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onRoundDecrement}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation"
              aria-label="Decrease round"
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
            <div className="text-3xl font-bold text-gray-900 min-w-[60px] text-center">
              {roundValue}
            </div>
            <button
              onClick={onRoundIncrement}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation"
              aria-label="Increase round"
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
        <GameCounter
          name="Extinction"
          color="red"
          maxDots={extinctionMax}
          value={extinctionValue}
          onIncrement={onExtinctionIncrement}
          onDecrement={onExtinctionDecrement}
          onReset={onExtinctionReset}
        />
        <GameCounter
          name="Civilization"
          color="blue"
          maxDots={civilizationMax}
          value={civilizationValue}
          onIncrement={onCivilizationIncrement}
          onDecrement={onCivilizationDecrement}
          onReset={onCivilizationReset}
        />
      </div>
    </div>
  );
}
