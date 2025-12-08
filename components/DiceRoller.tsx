"use client";

import { useState } from "react";

export default function DiceRoller() {
  const [value, setValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);

  // Possible values: 0, 1, or 2
  const possibleValues = [0, 1, 2];

  const rollDice = () => {
    if (isRolling) return;

    setIsRolling(true);
    setDisplayValue(null);

    // Animate rolling by rapidly changing displayed value
    const rollDuration = 1000; // 1 second
    const updateInterval = 50; // Update every 50ms
    const updates = rollDuration / updateInterval;
    let currentUpdate = 0;

    const rollInterval = setInterval(() => {
      // Show random value during animation
      const randomValue = possibleValues[Math.floor(Math.random() * possibleValues.length)];
      setDisplayValue(randomValue);
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(rollInterval);
        // Final roll
        const finalValue = possibleValues[Math.floor(Math.random() * possibleValues.length)];
        setValue(finalValue);
        setDisplayValue(finalValue);
        setIsRolling(false);
      }
    }, updateInterval);
  };

  const currentDisplay = displayValue !== null ? displayValue : value;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dice Roller</h3>
      
      <div className="flex flex-col items-center gap-4">
        {/* Dice Display */}
        <div
          className={`w-24 h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center text-4xl font-bold text-gray-800 transition-all duration-75 ${
            isRolling ? "animate-spin shadow-lg" : "shadow-md"
          }`}
        >
          {currentDisplay !== null ? (
            <span className={isRolling ? "opacity-70" : ""}>{currentDisplay}</span>
          ) : (
            <span className="text-gray-400">?</span>
          )}
        </div>

        {/* Roll Button */}
        <button
          onClick={rollDice}
          disabled={isRolling}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            isRolling
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg"
          }`}
        >
          {isRolling ? "Rolling..." : "Roll Dice"}
        </button>

        {/* Last Result */}
        {value !== null && !isRolling && (
          <p className="text-sm text-gray-600">
            Last roll: <span className="font-semibold">{value}</span>
          </p>
        )}
      </div>
    </div>
  );
}

