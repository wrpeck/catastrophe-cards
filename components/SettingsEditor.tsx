"use client";

import { useState, useEffect } from "react";
import { Settings } from "@/types/gameState";

interface SettingsEditorProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export default function SettingsEditor({
  settings,
  onSettingsChange,
}: SettingsEditorProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync localSettings when settings prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleExtinctionMaxChange = (value: number) => {
    const updated = { ...localSettings, extinctionCounterMax: value };
    setLocalSettings(updated);
    setHasChanges(true);
    onSettingsChange(updated);
  };

  const handleCivilizationMaxChange = (value: number) => {
    const updated = { ...localSettings, civilizationCounterMax: value };
    setLocalSettings(updated);
    setHasChanges(true);
    onSettingsChange(updated);
  };

  const handleCommunityCostPerMemberChange = (value: number) => {
    const updated = { ...localSettings, communityCostPerMember: value };
    setLocalSettings(updated);
    setHasChanges(true);
    onSettingsChange(updated);
  };

  const handleSoloRoundsChange = (value: number) => {
    const updated = { ...localSettings, soloRounds: value };
    setLocalSettings(updated);
    setHasChanges(true);
    onSettingsChange(updated);
  };

  const handleTurnAssistChange = (enabled: boolean) => {
    const updated = { ...localSettings, turnAssist: enabled };
    setLocalSettings(updated);
    setHasChanges(true);
    onSettingsChange(updated);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const updated = {
      ...localSettings,
      players: localSettings.players.map((p, i) =>
        i === index ? { name } : p
      ),
    };
    setLocalSettings(updated);
    setHasChanges(true);
    onSettingsChange(updated);
  };

  const handleAddPlayer = () => {
    const updated = {
      ...localSettings,
      players: [...localSettings.players, { name: "" }],
    };
    setLocalSettings(updated);
    setHasChanges(true);
    onSettingsChange(updated);
  };

  const handleRemovePlayer = (index: number) => {
    if (localSettings.players.length <= 1) return; // Keep at least one player
    const updated = {
      ...localSettings,
      players: localSettings.players.filter((_, i) => i !== index),
    };
    setLocalSettings(updated);
    setHasChanges(true);
    onSettingsChange(updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Game Settings
      </h3>

      {/* Counter Maximums */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Extinction Counter Maximum
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={localSettings.extinctionCounterMax}
            onChange={(e) =>
              handleExtinctionMaxChange(parseInt(e.target.value) || 1)
            }
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Civilization Counter Maximum
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={localSettings.civilizationCounterMax}
            onChange={(e) =>
              handleCivilizationMaxChange(parseInt(e.target.value) || 1)
            }
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Community Cost / Member
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={localSettings.communityCostPerMember}
            onChange={(e) =>
              handleCommunityCostPerMemberChange(parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Solo Rounds
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={localSettings.soloRounds}
            onChange={(e) =>
              handleSoloRoundsChange(parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={localSettings.turnAssist ?? true}
              onClick={() =>
                handleTurnAssistChange(!(localSettings.turnAssist ?? true))
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                localSettings.turnAssist ?? true ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  localSettings.turnAssist ?? true
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Turn Assist
              </label>
              <p className="text-xs text-gray-500">
                When enabled, enforces turn-based restrictions on card draws and
                actions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Players */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-700">
            Players
          </label>
          <button
            onClick={handleAddPlayer}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Player
          </button>
        </div>
        <div className="space-y-2">
          {localSettings.players.map((player, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={player.name}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                placeholder={`Player ${index + 1}`}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleRemovePlayer(index)}
                disabled={localSettings.players.length <= 1}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
