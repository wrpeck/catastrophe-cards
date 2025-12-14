"use client";

import { useState, useEffect } from "react";
import CountersContent from "./CountersContent";
import { GameState, Settings, Community } from "@/types/gameState";

interface CountersSidebarProps {
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

export default function CountersSidebar({
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
}: CountersSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 right-4 z-40 bg-white rounded-lg p-3 shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all touch-manipulation"
        aria-label="Open counters"
        style={{ touchAction: "manipulation" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } w-full sm:w-80`}
      >
        <div className="h-full overflow-y-auto">
          <div className="flex items-center justify-between p-4 pb-0">
            <h2 className="text-xl font-bold text-gray-900">
              Counters & Settings
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all touch-manipulation"
              aria-label="Close counters"
              style={{ touchAction: "manipulation" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <CountersContent
            roundValue={roundValue}
            onRoundIncrement={onRoundIncrement}
            onRoundDecrement={onRoundDecrement}
            onRoundReset={onRoundReset}
            roundCounterAnimate={roundCounterAnimate}
            extinctionValue={extinctionValue}
            extinctionCounterAnimate={extinctionCounterAnimate}
            civilizationValue={civilizationValue}
            civilizationCounterAnimate={civilizationCounterAnimate}
            extinctionMax={extinctionMax}
            civilizationMax={civilizationMax}
            onExtinctionIncrement={onExtinctionIncrement}
            onExtinctionDecrement={onExtinctionDecrement}
            onExtinctionReset={onExtinctionReset}
            onBuyExtinctionPoint={onBuyExtinctionPoint}
            extinctionPointCost={extinctionPointCost}
            canBuyExtinctionPoint={canBuyExtinctionPoint}
            onCompromise={onCompromise}
            canCompromise={canCompromise}
            compromiseValue={compromiseValue}
            onCivilizationIncrement={onCivilizationIncrement}
            onCivilizationDecrement={onCivilizationDecrement}
            onCivilizationReset={onCivilizationReset}
            onBuyCivilizationPoint={onBuyCivilizationPoint}
            civilizationPointCost={civilizationPointCost}
            canBuyCivilizationPoint={canBuyCivilizationPoint}
            gameState={gameState}
            onStateRestored={onStateRestored}
            onNewGame={onNewGame}
            settings={settings}
            onSettingsChange={onSettingsChange}
            currentTurnIndex={currentTurnIndex}
            turnOrder={turnOrder}
            onTurnIncrement={onTurnIncrement}
            onTurnDecrement={onTurnDecrement}
            onTurnReset={onTurnReset}
            communities={communities}
            currentTurnActionIndex={currentTurnActionIndex}
            turnActions={turnActions}
            onTurnActionIncrement={onTurnActionIncrement}
            onTurnActionDecrement={onTurnActionDecrement}
          />
        </div>
      </div>
    </>
  );
}
