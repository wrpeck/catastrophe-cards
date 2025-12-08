import { Card as CardType } from "@/types/card";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  isPinned?: boolean;
  showPinButton?: boolean;
  className?: string;
}

export default function Card({
  card,
  onClick,
  onPin,
  onUnpin,
  isPinned = false,
  showPinButton = false,
  className = "",
}: CardProps) {
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned && onUnpin) {
      onUnpin();
    } else if (!isPinned && onPin) {
      onPin();
    }
  };

  // Determine background color based on type
  const getBackgroundColor = () => {
    if (card.type === "good") {
      return "bg-green-100";
    } else if (card.type === "bad") {
      return "bg-red-100";
    } else if (card.type === "mixed") {
      return "bg-gradient-to-br from-green-100 to-red-100";
    }
    return "bg-white";
  };

  return (
    <div
      className={`${getBackgroundColor()} rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg relative ${
        onClick ? "cursor-pointer" : ""
      } ${isPinned ? "ring-2 ring-yellow-400" : ""} ${className}`}
      onClick={onClick}
    >
      {/* Pin Button */}
      {showPinButton && (
        <button
          onClick={handlePinClick}
          className={`absolute top-2 ${
            card.isTraitEffect ? "right-32" : "right-14"
          } p-2 rounded-full transition-all duration-200 z-10 ${
            isPinned
              ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
          aria-label={isPinned ? "Unpin card" : "Pin card"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M16 12V4h1a2 2 0 0 0 0-4H7a2 2 0 1 0 0 4h1v8a2 2 0 0 1-2 2H5a2 2 0 0 0 0 4h14a2 2 0 0 0 0-4h-3a2 2 0 0 1-2-2zm-5-3V4h2v5a1 1 0 1 1-2 0z" />
          </svg>
        </button>
      )}

      {/* Trait Effect Icon */}
      {card.isTraitEffect && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-100 text-blue-700 z-10"
          title={`Trait Effect: ${card.isTraitEffect}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <span className="text-xs font-medium whitespace-nowrap">
            {card.isTraitEffect}
          </span>
        </div>
      )}

      {/* Card Name */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {card.displayName}
        </h3>
      </div>

      {/* Placeholder Image */}
      <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <div className="text-white text-4xl font-bold opacity-50">📄</div>
      </div>

      {/* Desperate Measures: Cost and Effect side by side */}
      {card.cost ? (
        <>
          <div className="px-4 pt-4">
            <div className="flex items-center gap-4">
              {/* Cost on the left */}
              <div className="flex-1">
                <p className="text-lg font-bold text-red-600 leading-relaxed">
                  {card.cost}
                </p>
              </div>
              {/* Effect on the right */}
              <div className="flex-1">
                <p className="text-lg font-bold text-green-600 leading-relaxed text-right">
                  {card.effect}
                </p>
              </div>
            </div>
          </div>
          {/* Flavor below */}
          {card.flavor && (
            <div className="px-4 pt-3 pb-6">
              <p className="text-sm italic text-gray-600 leading-relaxed">
                {card.flavor}
              </p>
            </div>
          )}
          {!card.flavor && <div className="pb-6"></div>}
        </>
      ) : (
        <>
          {/* Effect */}
          {card.effect && (
            <div className="px-4 pt-4">
              <p className="text-sm font-bold text-gray-900 leading-relaxed">
                {card.effect}
              </p>
            </div>
          )}

          {/* Flavor */}
          {card.flavor && (
            <div className={`px-4 ${card.effect ? "pt-3" : "pt-4"} pb-6`}>
              <p className="text-sm italic text-gray-600 leading-relaxed">
                {card.flavor}
              </p>
            </div>
          )}

          {/* Ensure bottom padding when there's no flavor text */}
          {!card.flavor && card.effect && <div className="pb-6"></div>}
        </>
      )}
    </div>
  );
}
