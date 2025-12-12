"use client";

interface GameOutcomeBannerProps {
  outcome: "win" | "lose" | null;
}

export default function GameOutcomeBanner({ outcome }: GameOutcomeBannerProps) {
  if (!outcome) {
    return null;
  }

  const isWin = outcome === "win";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${
        isWin ? "bg-green-600 text-white" : "bg-red-600 text-white"
      } shadow-lg`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center gap-3">
          <div className="text-2xl font-bold">{isWin ? "🎉" : "💀"}</div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {isWin ? "Victory!" : "Defeat!"}
            </h2>
            <p className="text-sm opacity-90">
              {isWin
                ? "Civilization has reached its maximum and prevails!"
                : "Extinction has reached its maximum and civilization falls!"}
            </p>
          </div>
          <div className="text-2xl font-bold">{isWin ? "🎉" : "💀"}</div>
        </div>
      </div>
    </div>
  );
}
