"use client";

import { useState } from "react";
import { Community } from "@/types/gameState";

interface DiceRollerProps {
  currentTurnIndex: number;
  turnOrder: (string | "creation")[];
  communities: Community[];
}

type DiceMode = "resource" | "d6";

export default function DiceRoller({
  currentTurnIndex,
  turnOrder,
  communities,
}: DiceRollerProps) {
  const [mode, setMode] = useState<DiceMode>("resource");

  // Resource roll state
  const [value, setValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [lastRollTurn, setLastRollTurn] = useState<string | null>(null);

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

  // Possible values: 0, 1, or 2
  const possibleValues = [0, 1, 2];

  const rollResourceDice = () => {
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
      const randomValue =
        possibleValues[Math.floor(Math.random() * possibleValues.length)];
      setDisplayValue(randomValue);
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(rollInterval);
        // Final roll
        const finalValue =
          possibleValues[Math.floor(Math.random() * possibleValues.length)];
        setValue(finalValue);
        setDisplayValue(finalValue);
        setLastRollTurn(getCurrentTurnName());
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

    // Animate rolling by rapidly changing displayed values
    const rollDuration = 1000; // 1 second
    const updateInterval = 50; // Update every 50ms
    const updates = rollDuration / updateInterval;
    let currentUpdate = 0;

    const rollInterval = setInterval(() => {
      // Show random values during animation
      const randomResults = Array.from(
        { length: numDice },
        () => Math.floor(Math.random() * 6) + 1
      );
      setD6DisplayResults(randomResults);
      currentUpdate++;

      if (currentUpdate >= updates) {
        clearInterval(rollInterval);
        // Final roll
        const finalResults = Array.from(
          { length: numDice },
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
  const canRerollOnes = hasOnes && !hasRerolledOnes && !isRollingD6;

  const currentDisplay = displayValue !== null ? displayValue : value;
  const currentD6Display =
    d6DisplayResults !== null ? d6DisplayResults : d6Results;
  const d6Total = currentD6Display
    ? currentD6Display.reduce((sum, val) => sum + val, 0)
    : null;

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
      </div>

      {mode === "resource" ? (
        <div className="flex flex-col items-center gap-4">
          {/* Dice Display */}
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

          {/* Roll Button */}
          <button
            onClick={rollResourceDice}
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
              {lastRollTurn && (
                <span className="text-gray-500"> ({lastRollTurn})</span>
              )}
            </p>
          )}
        </div>
      ) : (
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
          </div>

          {/* Dice Display */}
          {currentD6Display && (
            <div className="w-full">
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {currentD6Display.map((dieValue, index) => (
                  <div
                    key={index}
                    className={`w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center text-2xl font-bold text-gray-800 shadow-md ${
                      isRollingD6 && (isRerolling ? rerollingIndices.has(index) : true)
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
                    <span className="font-semibold text-lg">{d6Total}</span>
                  </p>
                  {lastD6RollTurn && (
                    <p className="text-xs text-gray-500">
                      Last roll: ({lastD6RollTurn})
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Roll Button */}
          <button
            onClick={rollD6Dice}
            disabled={isRollingD6 || !isValidDiceCount}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
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

          {/* Reroll 1s Button */}
          {d6Results && canRerollOnes && (
            <button
              onClick={rerollOnes}
              disabled={isRollingD6}
              className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-orange-600 text-white hover:bg-orange-700 active:scale-95 shadow-md hover:shadow-lg"
            >
              Reroll 1s
            </button>
          )}
        </div>
      )}
    </div>
  );
}
