import { GameState } from "@/types/gameState";

const STORAGE_KEY = "catastrophe-cards-state";
const CURRENT_VERSION = "1.0.0";

export function saveGameState(state: GameState): void {
  try {
    const stateToSave: GameState = {
      ...state,
      version: CURRENT_VERSION,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error("Error saving game state:", error);
    throw new Error("Failed to save game state");
  }
}

export function loadGameState(): GameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const state = JSON.parse(saved) as GameState;
    
    // Check version compatibility
    if (state.version !== CURRENT_VERSION) {
      console.warn(
        `Save file version (${state.version}) differs from current version (${CURRENT_VERSION}). Loading anyway.`
      );
    }
    
    return state;
  } catch (error) {
    console.error("Error loading game state:", error);
    return null;
  }
}

export function exportGameState(state: GameState): void {
  try {
    const stateToExport: GameState = {
      ...state,
      version: CURRENT_VERSION,
      timestamp: Date.now(),
    };
    
    const json = JSON.stringify(stateToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Include timestamp in filename to avoid duplicates
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, -5);
    link.download = `catastrophe-cards-save-${timestamp}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting game state:", error);
    throw new Error("Failed to export game state");
  }
}

export async function importGameState(file: File): Promise<GameState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const state = JSON.parse(content) as GameState;
        
        // Validate basic structure
        if (!state.version || typeof state.extinctionValue !== "number") {
          throw new Error("Invalid save file format");
        }
        
        resolve(state);
      } catch (error) {
        console.error("Error importing game state:", error);
        reject(new Error("Failed to import game state. Invalid file format."));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsText(file);
  });
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing game state:", error);
    throw new Error("Failed to clear game state");
  }
}

export function hasSavedGameState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
}

export function getSavedGameTimestamp(): number | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const state = JSON.parse(saved) as GameState;
    return state.timestamp || null;
  } catch (error) {
    return null;
  }
}

