"use client";

interface GameCounterProps {
  name: string;
  color: "red" | "blue" | "green";
  maxDots: number;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  animate?: boolean;
  onBuy?: () => void;
  buyCost?: number;
  canBuy?: boolean;
  onCompromise?: () => void;
  canCompromise?: boolean;
  compromiseValue?: number;
}

export default function GameCounter({
  name,
  color,
  maxDots,
  value,
  onIncrement,
  onDecrement,
  onReset,
  animate = false,
  onBuy,
  buyCost,
  canBuy,
  onCompromise,
  canCompromise,
  compromiseValue,
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
    green: {
      dot: "bg-green-500",
      dotEmpty: "border-green-300",
      dotFilled: "bg-green-500",
      marker: "bg-green-600",
      button: "bg-green-600 hover:bg-green-700",
      text: "text-green-700",
    },
  };

  const colors = colorClasses[color];
  const clampedValue = Math.max(0, Math.min(maxDots, value));

  return (
    <div
      className={`rounded-lg p-4 border-2 shadow-sm transition-all duration-300 ${
        animate
          ? color === "red"
            ? "bg-red-200 border-red-500 shadow-xl ring-2 ring-red-300"
            : color === "green"
            ? "bg-green-200 border-green-500 shadow-xl ring-2 ring-green-300"
            : "bg-blue-100 border-blue-400 shadow-lg"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`text-lg font-semibold transition-all duration-300 ${
            animate && color === "red"
              ? "text-red-800 font-bold"
              : animate && color === "green"
              ? "text-green-800 font-bold"
              : colors.text
          }`}
        >
          {name}
        </h3>
        <span
          className={`text-2xl font-bold transition-all duration-300 ${
            animate
              ? color === "red"
                ? "animate-pulse scale-125 text-red-800 font-extrabold drop-shadow-lg"
                : color === "green"
                ? "animate-pulse scale-125 text-green-800 font-extrabold drop-shadow-lg"
                : "animate-pulse scale-125 text-blue-700 font-extrabold"
              : colors.text
          }`}
        >
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
      <div className="flex flex-col gap-2">
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
        {name === "Civilization" && onBuy && buyCost !== undefined && (
          <button
            onClick={onBuy}
            disabled={canBuy === false}
            className={`w-full px-3 py-2 rounded-lg font-medium text-sm text-white transition-all duration-200 touch-manipulation ${
              canBuy === false
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 active:scale-95"
            }`}
            style={{ touchAction: "manipulation" }}
            title={
              canBuy === false
                ? "Insufficient resources"
                : `Buy a civilization point for ${buyCost} resources`
            }
          >
            Buy ({buyCost})
          </button>
        )}
        {name === "Extinction" && (
          <div className="flex gap-2">
            {onBuy && buyCost !== undefined && (
              <button
                onClick={onBuy}
                disabled={canBuy === false}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm text-white transition-all duration-200 touch-manipulation ${
                  canBuy === false
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 active:scale-95"
                }`}
                style={{ touchAction: "manipulation" }}
                title={
                  canBuy === false
                    ? "Requires: Community turn, Research Lab trait, and sufficient resources"
                    : `Buy an extinction point decrease for ${buyCost} resources`
                }
              >
                Buy ({buyCost})
              </button>
            )}
            {onCompromise && (
              <button
                onClick={onCompromise}
                disabled={canCompromise === false}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm text-white transition-all duration-200 touch-manipulation ${
                  canCompromise === false
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 active:scale-95"
                }`}
                style={{ touchAction: "manipulation" }}
                title={
                  canCompromise === false
                    ? "Not available during creation phase"
                    : `Increase extinction by 1, gain ${
                        compromiseValue ?? 5
                      } resources`
                }
              >
                Compromise ({compromiseValue ?? 5})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
