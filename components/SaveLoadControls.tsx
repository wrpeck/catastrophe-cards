"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  saveGameState,
  exportGameState,
  importGameState,
  clearGameState,
  getSavedGameTimestamp,
} from "@/utils/gameState";
import { GameState } from "@/types/gameState";

interface SaveLoadControlsProps {
  gameState: GameState;
  onStateRestored: (state: GameState) => void;
  onNewGame: () => void;
}

export default function SaveLoadControls({
  gameState,
  onStateRestored,
  onNewGame,
}: SaveLoadControlsProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSaveTimestamp = getSavedGameTimestamp();

  const handleSave = () => {
    try {
      // Manual save to localStorage
      saveGameState(gameState);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      setErrorMessage("Failed to save game");
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, 3000);
    }
  };

  const handleExport = () => {
    try {
      exportGameState(gameState);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      setErrorMessage("Failed to export game");
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, 3000);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedState = await importGameState(file);
      if (
        window.confirm(
          "Importing a game will replace your current game state. Continue?"
        )
      ) {
        onStateRestored(importedState);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to import game"
      );
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, 3000);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleNewGameClick = () => {
    setShowNewGameModal(true);
  };

  const handleExportBeforeNewGame = () => {
    try {
      exportGameState(gameState);
      handleNewGameConfirm();
    } catch (error) {
      setErrorMessage("Failed to export game before starting new game");
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, 3000);
    }
  };

  const handleNewGameConfirm = () => {
    try {
      clearGameState();
      onNewGame();
      setShowNewGameModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      setErrorMessage("Failed to start new game");
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, 3000);
    }
  };

  const handleCancelNewGame = () => {
    setShowNewGameModal(false);
  };

  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Save & Load
      </h3>
      
      {showSuccess && (
        <div className="mb-2 p-1.5 bg-green-100 text-green-700 rounded text-xs">
          Success!
        </div>
      )}
      
      {showError && (
        <div className="mb-2 p-1.5 bg-red-100 text-red-700 rounded text-xs">
          {errorMessage}
        </div>
      )}

      <div className="space-y-1.5">
        <button
          onClick={handleSave}
          className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
        >
          Save to Browser
        </button>
        
        <button
          onClick={handleExport}
          className="w-full px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
        >
          Export to File
        </button>
        
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file-input"
          />
          <label
            htmlFor="import-file-input"
            className="block w-full px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium text-center cursor-pointer"
          >
            Import
          </label>
        </div>
        
      </div>

      {lastSaveTimestamp && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Saved: {formatTimestamp(lastSaveTimestamp)}
          </p>
        </div>
      )}

      {/* New Game Button - Separated */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <button
          onClick={handleNewGameClick}
          className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
        >
          New Game
        </button>
      </div>

      {/* New Game Confirmation Modal - Rendered via Portal */}
      {showNewGameModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative z-[10000]">
              <h2 className="text-lg font-bold mb-4">Start New Game?</h2>
              <p className="text-gray-600 mb-4">
                Starting a new game will clear your current game state. This cannot be undone.
              </p>
              <p className="text-gray-600 mb-6">
                Would you like to download a copy of your current game state before starting a new game?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleExportBeforeNewGame}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Download & Start New Game
                </button>
              <button
                onClick={handleNewGameConfirm}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                Start New Game (No Download)
              </button>
                <button
                  onClick={handleCancelNewGame}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

