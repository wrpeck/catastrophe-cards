"use client";

interface GameCounterProps {
  name: string;
  color: "red" | "blue";
  maxDots: number;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
}

export default function GameCounter({
  name,
  color,
  maxDots,
  value,
  onIncrement,
  onDecrement,
  onReset,
}: GameCounterProps) {
  const colorClasses = {
    red: {
      dot: "bg-red-500",
      dotEmpty: "border-red-300",
      dotFilled: "bg-red-500",
      marker: "bg-red-600",
      button: "bg-red-600 hover:bg-red-700",
      text: "text-red-700",
    },
    blue: {
      dot: "bg-blue-500",
      dotEmpty: "border-blue-300",
      dotFilled: "bg-blue-500",
      marker: "bg-blue-600",
      button: "bg-blue-600 hover:bg-blue-700",
      text: "text-blue-700",
    },
  };

  const colors = colorClasses[color];
  const clampedValue = Math.max(0, Math.min(maxDots, value));

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-lg font-semibold ${colors.text}`}>{name}</h3>
        <span className={`text-2xl font-bold ${colors.text}`}>
          {clampedValue}
        </span>
      </div>

      {/* Dots visualization */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between">
          {Array.from({ length: maxDots }, (_, index) => {
            const dotIndex = index + 1;
            const isFilled = dotIndex <= clampedValue;
            const isCurrent = dotIndex === clampedValue;

            return (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-200 ${
                  isFilled
                    ? `${colors.dotFilled} ${
                        isCurrent ? "ring-2 ring-offset-1 " + colors.marker : ""
                      }`
                    : `border-2 ${colors.dotEmpty} bg-white`
                }`}
              />
            );
          })}
        </div>

        {/* Position marker */}
        {clampedValue > 0 && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 ${colors.marker} w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-300`}
            style={{
              left:
                maxDots === 1
                  ? "calc(50% - 8px)"
                  : `calc(${
                      ((clampedValue - 1) / (maxDots - 1)) * 100
                    }% - 8px)`,
            }}
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={onDecrement}
          disabled={clampedValue <= 0}
          className={`flex-1 px-3 py-2 rounded-lg font-medium text-white transition-all duration-200 touch-manipulation ${
            clampedValue <= 0
              ? "bg-gray-300 cursor-not-allowed"
              : `${colors.button} active:scale-95`
          }`}
          style={{ touchAction: "manipulation" }}
        >
          −
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95 transition-all duration-200 touch-manipulation"
          style={{ touchAction: "manipulation" }}
        >
          Reset
        </button>
        <button
          onClick={onIncrement}
          disabled={clampedValue >= maxDots}
          className={`flex-1 px-3 py-2 rounded-lg font-medium text-white transition-all duration-200 touch-manipulation ${
            clampedValue >= maxDots
              ? "bg-gray-300 cursor-not-allowed"
              : `${colors.button} active:scale-95`
          }`}
          style={{ touchAction: "manipulation" }}
        >
          +
        </button>
      </div>
    </div>
  );
}
