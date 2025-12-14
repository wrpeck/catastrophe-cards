import { Card as CardType } from "@/types/card";
import { Community, PinnedCardWithDeck } from "@/types/gameState";
import { useState } from "react";
import TraitEffectInfobox from "./TraitEffectInfobox";
import { getEfficientTraitCostReduction } from "@/utils/communityTraitEffects";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  isPinned?: boolean;
  showPinButton?: boolean;
  className?: string;
  deckTitle?: string; // To determine if it's a trait and which type
  communityMemberCount?: number; // For community traits - number of members to calculate cost (deprecated, use turn info instead)
  currentTurnIndex?: number; // Current turn index
  turnOrder?: (string | "creation")[]; // Turn order array
  communities?: Community[]; // Communities array
  individualTraitCards?: CardType[]; // Individual trait cards for trait effect lookup
  communityTraitCards?: CardType[]; // Community trait cards for trait effect lookup
  cardPlayerAssignments?: Map<string, string>; // Map of card keys to player names
  pinnedCards?: PinnedCardWithDeck[]; // All pinned cards
}

export default function Card({
  card,
  onClick,
  onPin,
  onUnpin,
  isPinned = false,
  showPinButton = false,
  className = "",
  deckTitle,
  communityMemberCount,
  currentTurnIndex,
  turnOrder,
  communities,
  individualTraitCards = [],
  communityTraitCards = [],
  cardPlayerAssignments = new Map(),
  pinnedCards = [],
}: CardProps) {
  const [showTraitInfobox, setShowTraitInfobox] = useState(false);
  const [selectedTraitCard, setSelectedTraitCard] = useState<CardType | null>(
    null
  );
  const [traitInfoboxPosition, setTraitInfoboxPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned && onUnpin) {
      onUnpin();
    } else if (!isPinned && onPin) {
      onPin();
    }
  };

  const handleTraitEffectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!card.isTraitEffect) return;

    // Toggle infobox if already showing
    if (showTraitInfobox) {
      setShowTraitInfobox(false);
      setSelectedTraitCard(null);
      return;
    }

    // Search for the trait card in both individual and community trait decks
    const traitCard =
      individualTraitCards.find((t) => t.displayName === card.isTraitEffect) ||
      communityTraitCards.find((t) => t.displayName === card.isTraitEffect);

    if (traitCard) {
      const buttonRect = (
        e.currentTarget as HTMLElement
      ).getBoundingClientRect();
      // Position infobox below the badge, slightly to the right
      setTraitInfoboxPosition({
        top: buttonRect.bottom + 8,
        left: buttonRect.left,
      });
      setSelectedTraitCard(traitCard);
      setShowTraitInfobox(true);
    }
  };

  // Calculate trait cost
  const getTraitCost = (): {
    baseCost: number;
    memberCount?: number;
    isCommunity: boolean;
    efficientReduction?: number;
  } | null => {
    if (deckTitle === "Individual Traits") {
      const baseCost = card.traitCost ?? 5;

      // Check if it's a community's turn (Efficient only applies on community turns)
      const isCommunityTurn =
        currentTurnIndex !== undefined &&
        turnOrder &&
        turnOrder.length > 0 &&
        communities &&
        currentTurnIndex < turnOrder.length &&
        turnOrder[currentTurnIndex] !== "creation" &&
        communities.some((c) => c.id === turnOrder[currentTurnIndex]);

      if (isCommunityTurn && communities) {
        const currentTurn = turnOrder[currentTurnIndex];
        const currentCommunity = communities.find((c) => c.id === currentTurn);
        if (currentCommunity) {
          const efficientReduction = getEfficientTraitCostReduction(
            currentCommunity,
            cardPlayerAssignments,
            pinnedCards
          );
          return {
            baseCost: Math.max(1, baseCost - efficientReduction),
            isCommunity: false,
            efficientReduction:
              efficientReduction > 0 ? efficientReduction : undefined,
          };
        }
      }

      return {
        baseCost,
        isCommunity: false,
      };
    } else if (deckTitle === "Community Traits") {
      const baseCost = card.traitCost ?? 10;

      // Check if it's a community's turn
      const isCommunityTurn =
        currentTurnIndex !== undefined &&
        turnOrder &&
        turnOrder.length > 0 &&
        communities &&
        currentTurnIndex < turnOrder.length &&
        turnOrder[currentTurnIndex] !== "creation" &&
        communities.some((c) => c.id === turnOrder[currentTurnIndex]);

      if (isCommunityTurn && communities) {
        // It's a community's turn - show base cost + member count
        const currentTurn = turnOrder[currentTurnIndex];
        const currentCommunity = communities.find((c) => c.id === currentTurn);
        if (currentCommunity) {
          const memberCount = currentCommunity.memberPlayerNames.length;
          const efficientReduction = getEfficientTraitCostReduction(
            currentCommunity,
            cardPlayerAssignments,
            pinnedCards
          );

          return {
            baseCost, // Return original baseCost, not finalCost
            memberCount,
            isCommunity: true,
            efficientReduction:
              efficientReduction > 0 ? efficientReduction : undefined,
          };
        }
      }

      // Individual turn or Creation turn - show base cost + icon (no member count)
      return {
        baseCost,
        isCommunity: true,
      };
    }
    return null;
  };

  const traitCostInfo = getTraitCost();
  const isIndividualTrait = deckTitle === "Individual Traits";
  const isCommunityTrait = deckTitle === "Community Traits";

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
      className={`${getBackgroundColor()} rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg relative w-64 max-w-full ${
        onClick ? "cursor-pointer" : ""
      } ${isPinned ? "ring-2 ring-yellow-400" : ""} ${className}`}
      onClick={onClick}
    >
      {/* Trait Cost Display - Upper Right Corner */}
      {traitCostInfo !== null && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-800 z-10">
          <span className="text-sm font-bold">{traitCostInfo.baseCost}</span>
          {traitCostInfo.isCommunity && (
            <>
              <span className="text-sm font-bold">+</span>
              {traitCostInfo.memberCount !== undefined ? (
                <span className="text-sm font-bold">
                  {traitCostInfo.memberCount}
                </span>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              )}
            </>
          )}
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
            <div
              className={`px-4 pt-3 ${card.isTraitEffect ? "pb-10" : "pb-6"}`}
            >
              <p className="text-xs italic text-gray-600 leading-relaxed">
                {card.flavor}
              </p>
            </div>
          )}
          {!card.flavor && (
            <div className={card.isTraitEffect ? "pb-10" : "pb-6"}></div>
          )}
        </>
      ) : card.effect1 && card.effect2 ? (
        <>
          {/* Wanderer: Effect1 and Effect2 stacked vertically with "OR" between */}
          <div className="px-4 pt-4">
            <div className="flex flex-col items-center gap-3">
              {/* Effect1 on top */}
              <div className="w-full">
                <p className="text-sm font-bold text-gray-900 leading-relaxed text-center">
                  {card.effect1}
                </p>
              </div>
              {/* Large centered "OR" */}
              <div className="flex-shrink-0">
                <p className="text-2xl font-bold text-gray-700 uppercase">OR</p>
              </div>
              {/* Effect2 on bottom */}
              <div className="w-full">
                <p className="text-sm font-bold text-gray-900 leading-relaxed text-center">
                  {card.effect2}
                </p>
              </div>
            </div>
          </div>
          {/* Flavor below */}
          {card.flavor && (
            <div
              className={`px-4 pt-3 ${card.isTraitEffect ? "pb-10" : "pb-6"}`}
            >
              <p className="text-xs italic text-gray-600 leading-relaxed">
                {card.flavor}
              </p>
            </div>
          )}
          {!card.flavor && (
            <div className={card.isTraitEffect ? "pb-10" : "pb-6"}></div>
          )}
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
            <div
              className={`px-4 ${card.effect ? "pt-3" : "pt-4"} ${
                card.isTraitEffect ? "pb-10" : "pb-6"
              }`}
            >
              <p className="text-xs italic text-gray-600 leading-relaxed">
                {card.flavor}
              </p>
            </div>
          )}

          {/* Ensure bottom padding when there's no flavor text */}
          {!card.flavor && card.effect && (
            <div className={card.isTraitEffect ? "pb-10" : "pb-6"}></div>
          )}
        </>
      )}

      {/* Trait Effect Icon - positioned at bottom right */}
      {card.isTraitEffect && (
        <button
          onClick={handleTraitEffectClick}
          className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-100 text-blue-700 z-10 hover:bg-blue-200 transition-colors cursor-pointer"
          title={`Click to view trait effect: ${card.isTraitEffect}`}
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
        </button>
      )}

      {/* Trait Effect Infobox */}
      {showTraitInfobox && selectedTraitCard && (
        <TraitEffectInfobox
          traitName={card.isTraitEffect || ""}
          traitCard={selectedTraitCard}
          position={traitInfoboxPosition}
          onClose={() => {
            setShowTraitInfobox(false);
            setSelectedTraitCard(null);
          }}
        />
      )}
    </div>
  );
}
