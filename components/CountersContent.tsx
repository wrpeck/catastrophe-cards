"use client";

import { useState } from "react";
import GameCounter from "./GameCounter";
import SaveLoadControls from "./SaveLoadControls";
import SettingsEditor from "./SettingsEditor";
import TurnTracker from "./TurnTracker";
import { GameState, Settings, Community } from "@/types/gameState";

interface CountersContentProps {
  roundValue: number;
  onRoundIncrement: () => void;
  onRoundDecrement: () => void;
  onRoundReset: () => void;
  roundCounterAnimate?: boolean;
  extinctionValue: number;
  extinctionCounterAnimate?: boolean;
  civilizationValue: number;
  civilizationCounterAnimate?: boolean;
  extinctionMax: number;
  civilizationMax: number;
  onExtinctionIncrement: () => void;
  onExtinctionDecrement: () => void;
  onExtinctionReset: () => void;
  onBuyExtinctionPoint?: () => void;
  extinctionPointCost?: number;
  canBuyExtinctionPoint?: boolean;
  onCompromise?: () => void;
  canCompromise?: boolean;
  compromiseValue?: number;
  onCivilizationIncrement: () => void;
  onCivilizationDecrement: () => void;
  onCivilizationReset: () => void;
  onBuyCivilizationPoint?: () => void;
  civilizationPointCost?: number;
  canBuyCivilizationPoint?: boolean;
  gameState: GameState;
  onStateRestored: (state: GameState) => void;
  onNewGame: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  currentTurnIndex: number;
  turnOrder: (string | "creation")[];
  onTurnIncrement: () => void;
  onTurnDecrement: () => void;
  onTurnReset: () => void;
  communities: Community[];
  currentTurnActionIndex: number;
  turnActions: string[];
  onTurnActionIncrement: () => void;
  onTurnActionDecrement: () => void;
}

export default function CountersContent({
  roundValue,
  onRoundIncrement,
  onRoundDecrement,
  onRoundReset,
  roundCounterAnimate = false,
  extinctionValue,
  extinctionCounterAnimate = false,
  civilizationValue,
  civilizationCounterAnimate = false,
  extinctionMax,
  civilizationMax,
  onExtinctionIncrement,
  onExtinctionDecrement,
  onExtinctionReset,
  onBuyExtinctionPoint,
  extinctionPointCost,
  canBuyExtinctionPoint,
  onCompromise,
  canCompromise,
  compromiseValue,
  onCivilizationIncrement,
  onCivilizationDecrement,
  onCivilizationReset,
  onBuyCivilizationPoint,
  civilizationPointCost,
  canBuyCivilizationPoint,
  gameState,
  onStateRestored,
  onNewGame,
  settings,
  onSettingsChange,
  currentTurnIndex,
  turnOrder,
  onTurnIncrement,
  onTurnDecrement,
  onTurnReset,
  communities,
  currentTurnActionIndex,
  turnActions,
  onTurnActionIncrement,
  onTurnActionDecrement,
}: CountersContentProps) {
  const [activeTab, setActiveTab] = useState<"counters" | "settings">(
    "counters"
  );

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("counters")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "counters"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Counters
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "settings"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "counters" && (
        <div className="space-y-4">
          {/* Round Counter */}
          <div
            className={`rounded-lg p-4 border-2 transition-all duration-300 ${
              roundCounterAnimate
                ? "bg-blue-100 border-blue-400 shadow-lg"
                : "bg-gray-50 border-gray-200"
            }`}
          >
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
              <div
                className={`text-3xl font-bold min-w-[60px] text-center transition-all duration-300 ${
                  roundCounterAnimate
                    ? "animate-pulse scale-125 text-blue-700 font-extrabold"
                    : "text-gray-900"
                }`}
              >
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
          <TurnTracker
            currentTurnIndex={currentTurnIndex}
            turnOrder={turnOrder}
            onTurnIncrement={onTurnIncrement}
            onTurnDecrement={onTurnDecrement}
            onTurnReset={onTurnReset}
            communities={communities}
            turnAssist={settings.turnAssist ?? true}
            currentTurnActionIndex={currentTurnActionIndex}
            turnActions={turnActions}
            onTurnActionIncrement={onTurnActionIncrement}
            onTurnActionDecrement={onTurnActionDecrement}
          />
          <GameCounter
            name="Extinction"
            color="red"
            maxDots={extinctionMax}
            value={extinctionValue}
            onIncrement={onExtinctionIncrement}
            onDecrement={onExtinctionDecrement}
            onReset={onExtinctionReset}
            animate={extinctionCounterAnimate}
            onBuy={onBuyExtinctionPoint}
            buyCost={extinctionPointCost}
            canBuy={canBuyExtinctionPoint}
            onCompromise={onCompromise}
            canCompromise={canCompromise}
            compromiseValue={compromiseValue}
          />
          <GameCounter
            name="Civilization"
            color="green"
            maxDots={civilizationMax}
            value={civilizationValue}
            onIncrement={onCivilizationIncrement}
            onDecrement={onCivilizationDecrement}
            onReset={onCivilizationReset}
            animate={civilizationCounterAnimate}
            onBuy={onBuyCivilizationPoint}
            buyCost={civilizationPointCost}
            canBuy={canBuyCivilizationPoint}
          />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          <SettingsEditor
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
          <SaveLoadControls
            gameState={gameState}
            onStateRestored={onStateRestored}
            onNewGame={onNewGame}
          />
        </div>
      )}
    </div>
  );
}
