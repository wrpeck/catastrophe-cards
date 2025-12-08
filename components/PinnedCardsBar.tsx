"use client";

import { useState, useRef, useEffect } from "react";
import { Card as CardType } from "@/types/card";
import Card from "./Card";

interface PinnedCardWithDeck extends CardType {
  deckTitle: string;
}

interface Community {
  id: string;
  name: string;
  resources: number;
  memberPlayerNames: string[];
}

interface PinnedCardsBarProps {
  pinnedCards: PinnedCardWithDeck[];
  onUnpin: (card: PinnedCardWithDeck) => void;
  extinctionValue: number;
  civilizationValue: number;
  players: string[];
  cardPlayerAssignments: Map<string, string>;
  onAssignPlayer: (card: PinnedCardWithDeck, playerName: string | null) => void;
  getCardPlayerAssignment: (card: PinnedCardWithDeck) => string | null;
  communities: Community[];
  communityTraitAssignments: Map<string, string>;
  onAssignCommunityTrait: (
    card: PinnedCardWithDeck,
    communityId: string | null
  ) => void;
  getCommunityTraitAssignment: (card: PinnedCardWithDeck) => string | null;
}

type ActiveTab = "individual" | "community";

export default function PinnedCardsBar({
  pinnedCards,
  onUnpin,
  extinctionValue,
  civilizationValue,
  players,
  cardPlayerAssignments,
  onAssignPlayer,
  getCardPlayerAssignment,
  communities,
  communityTraitAssignments,
  onAssignCommunityTrait,
  getCommunityTraitAssignment,
}: PinnedCardsBarProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("individual");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [expandedPosition, setExpandedPosition] = useState<{
    left: number;
    bottom: number;
  } | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const expandedCardRef = useRef<HTMLDivElement | null>(null);
  const individualScrollRef = useRef<HTMLDivElement | null>(null);
  const communityScrollRef = useRef<HTMLDivElement | null>(null);
  const [individualCanScrollLeft, setIndividualCanScrollLeft] = useState(false);
  const [individualCanScrollRight, setIndividualCanScrollRight] =
    useState(false);
  const [communityCanScrollLeft, setCommunityCanScrollLeft] = useState(false);
  const [communityCanScrollRight, setCommunityCanScrollRight] = useState(false);
  const [showPlayerMenu, setShowPlayerMenu] = useState<string | null>(null); // cardKey of card showing menu
  const [showCommunityMenu, setShowCommunityMenu] = useState<string | null>(
    null
  ); // cardKey of card showing menu
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [communityMenuPosition, setCommunityMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const individualCards = pinnedCards.filter(
    (card) => card.deckTitle === "Individual Traits"
  );
  const communityCards = pinnedCards.filter(
    (card) => card.deckTitle === "Community Traits"
  );

  useEffect(() => {
    const updateExpandedPosition = () => {
      if (expandedCardId && cardRefs.current.has(expandedCardId)) {
        const cardElement = cardRefs.current.get(expandedCardId);
        if (cardElement) {
          const rect = cardElement.getBoundingClientRect();
          const cardWidth = 256; // w-64 = 16rem = 256px
          const halfCardWidth = cardWidth / 2;
          const padding = 16; // 1rem padding from viewport edges

          let left = rect.left + rect.width / 2;

          // Ensure card doesn't go off left edge
          if (left - halfCardWidth < padding) {
            left = padding + halfCardWidth;
          }
          // Ensure card doesn't go off right edge
          if (left + halfCardWidth > window.innerWidth - padding) {
            left = window.innerWidth - padding - halfCardWidth;
          }

          setExpandedPosition({
            left,
            bottom: window.innerHeight - rect.top + 8,
          });
        }
      } else {
        setExpandedPosition(null);
      }
    };

    updateExpandedPosition();

    // Update position on scroll and resize
    window.addEventListener("scroll", updateExpandedPosition, true);
    window.addEventListener("resize", updateExpandedPosition);

    return () => {
      window.removeEventListener("scroll", updateExpandedPosition, true);
      window.removeEventListener("resize", updateExpandedPosition);
    };
  }, [expandedCardId]);

  // Check scroll position for individual container
  const checkIndividualScrollPosition = () => {
    if (individualScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        individualScrollRef.current;
      setIndividualCanScrollLeft(scrollLeft > 0);
      setIndividualCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Check scroll position for community container
  const checkCommunityScrollPosition = () => {
    if (communityScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        communityScrollRef.current;
      setCommunityCanScrollLeft(scrollLeft > 0);
      setCommunityCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkIndividualScrollPosition();
    checkCommunityScrollPosition();

    const individualScroll = individualScrollRef.current;
    const communityScroll = communityScrollRef.current;

    if (individualScroll) {
      individualScroll.addEventListener(
        "scroll",
        checkIndividualScrollPosition
      );
    }
    if (communityScroll) {
      communityScroll.addEventListener("scroll", checkCommunityScrollPosition);
    }
    window.addEventListener("resize", checkIndividualScrollPosition);
    window.addEventListener("resize", checkCommunityScrollPosition);

    return () => {
      if (individualScroll) {
        individualScroll.removeEventListener(
          "scroll",
          checkIndividualScrollPosition
        );
      }
      if (communityScroll) {
        communityScroll.removeEventListener(
          "scroll",
          checkCommunityScrollPosition
        );
      }
      window.removeEventListener("resize", checkIndividualScrollPosition);
      window.removeEventListener("resize", checkCommunityScrollPosition);
    };
  }, [individualCards.length, communityCards.length]);

  // Close expanded card and player menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Close player menu if clicking outside
      if (
        showPlayerMenu &&
        !target.closest(".player-menu-container") &&
        !target.closest(".player-assignment-menu")
      ) {
        setShowPlayerMenu(null);
        setMenuPosition(null);
      }

      // Close community menu if clicking outside
      if (
        showCommunityMenu &&
        !target.closest(".community-menu-container") &&
        !target.closest(".community-assignment-menu")
      ) {
        setShowCommunityMenu(null);
        setCommunityMenuPosition(null);
      }

      // Close expanded card if clicking outside (but not on buttons)
      if (
        expandedCardId &&
        !target.closest(".pinned-card-container") &&
        !target.closest(".expanded-card-overlay") &&
        !target.closest(".player-menu-container") &&
        !target.closest(".player-assignment-menu") &&
        !target.closest(".community-menu-container") &&
        !target.closest(".community-assignment-menu")
      ) {
        setExpandedCardId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPlayerMenu, showCommunityMenu, expandedCardId]);

  const handleCardClick = (cardId: string, e: React.MouseEvent) => {
    // Don't expand if clicking on buttons
    if (
      (e.target as Element).closest("button") ||
      (e.target as Element).closest(".player-assignment-menu")
    ) {
      return;
    }

    // Toggle expansion
    setExpandedCardId(expandedCardId === cardId ? null : cardId);
  };

  const expandedCard = pinnedCards.find((card) => {
    const cardKey = `${card.id}-${card.deckTitle}`;
    return cardKey === expandedCardId;
  });

  const renderCardContainer = (
    cards: PinnedCardWithDeck[],
    scrollRef: React.RefObject<HTMLDivElement>,
    canScrollLeft: boolean,
    canScrollRight: boolean,
    containerKey: string
  ) => {
    const isIndividualTraits = containerKey === "individual";
    return (
      <div className="relative">
        {/* Left fade gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none z-10 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
        )}

        {/* Right fade gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 flex items-center justify-end">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        >
          {cards.length === 0 ? (
            <div className="flex items-center justify-center w-full py-2">
              <p className="text-sm text-gray-400 italic">
                No pinned{" "}
                {containerKey === "individual" ? "Individual" : "Community"}{" "}
                Traits cards.
              </p>
            </div>
          ) : (
            cards.map((card, index) => {
              const cardKey = `${card.id}-${card.deckTitle}`;
              const isExpanded = cardKey === expandedCardId;
              const assignedPlayer = isIndividualTraits
                ? getCardPlayerAssignment(card)
                : null;
              const assignedCommunity = !isIndividualTraits
                ? getCommunityTraitAssignment(card)
                : null;
              const isPlayerMenuOpen = showPlayerMenu === cardKey;
              const isCommunityMenuOpen = showCommunityMenu === cardKey;

              return (
                <div
                  key={`pinned-${cardKey}-${index}`}
                  ref={(el) => {
                    if (el) {
                      cardRefs.current.set(cardKey, el);
                    } else {
                      cardRefs.current.delete(cardKey);
                    }
                  }}
                  className="shrink-0 relative pinned-card-container"
                >
                  <div
                    onClick={(e) => handleCardClick(cardKey, e)}
                    className={`${
                      card.type === "good"
                        ? "bg-green-100"
                        : card.type === "bad"
                        ? "bg-red-100"
                        : card.type === "mixed"
                        ? "bg-gradient-to-br from-green-100 to-red-100"
                        : "bg-white"
                    } rounded-lg border-2 border-yellow-400 shadow-md px-4 py-3 min-w-[120px] max-w-[200px] cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
                      isExpanded ? "bg-yellow-50 border-yellow-500" : ""
                    }`}
                  >
                    {/* Trait Effect Icon */}
                    {card.isTraitEffect && (
                      <div
                        className="absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 z-10"
                        title={`Trait Effect: ${card.isTraitEffect}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 shrink-0"
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
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate flex-1">
                          {card.displayName}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {isIndividualTraits && (
                            <div className="relative player-menu-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const buttonRect = (
                                    e.currentTarget as HTMLElement
                                  ).getBoundingClientRect();
                                  const menuWidth = 140;
                                  const padding = 8;

                                  setMenuPosition({
                                    top: buttonRect.top,
                                    left: Math.max(
                                      padding,
                                      Math.min(
                                        buttonRect.right - menuWidth,
                                        (typeof window !== "undefined"
                                          ? window.innerWidth
                                          : 1200) -
                                          menuWidth -
                                          padding
                                      )
                                    ),
                                  });
                                  setShowPlayerMenu(
                                    isPlayerMenuOpen ? null : cardKey
                                  );
                                }}
                                className="p-1 rounded-full hover:bg-blue-100 transition-colors"
                                aria-label="Assign player"
                                title="Assign player"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3.5 w-3.5 text-blue-600"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                </svg>
                              </button>
                              {isPlayerMenuOpen && menuPosition && (
                                <div
                                  className="fixed bg-white border border-gray-200 rounded-md shadow-xl z-[110] min-w-[140px] max-h-[200px] overflow-y-auto player-assignment-menu"
                                  style={{
                                    top: `${menuPosition.top}px`,
                                    left: `${menuPosition.left}px`,
                                    transform: "translateY(-100%)",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="py-1">
                                    {players.length === 0 ? (
                                      <div className="px-3 py-2 text-xs text-gray-500">
                                        No players configured
                                      </div>
                                    ) : (
                                      <>
                                        {players.map((playerName) => (
                                          <button
                                            key={playerName}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onAssignPlayer(
                                                card,
                                                assignedPlayer === playerName
                                                  ? null
                                                  : playerName
                                              );
                                              setShowPlayerMenu(null);
                                              setMenuPosition(null);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors whitespace-nowrap ${
                                              assignedPlayer === playerName
                                                ? "bg-blue-50 text-blue-700 font-medium"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            {playerName}
                                          </button>
                                        ))}
                                        {assignedPlayer && (
                                          <>
                                            <div className="border-t border-gray-200 my-1" />
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onAssignPlayer(card, null);
                                                setShowPlayerMenu(null);
                                                setMenuPosition(null);
                                              }}
                                              className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                                            >
                                              Remove assignment
                                            </button>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {!isIndividualTraits && (
                            <div className="relative community-menu-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const buttonRect = (
                                    e.currentTarget as HTMLElement
                                  ).getBoundingClientRect();
                                  const menuWidth = 140;
                                  const padding = 8;

                                  setCommunityMenuPosition({
                                    top: buttonRect.top,
                                    left: Math.max(
                                      padding,
                                      Math.min(
                                        buttonRect.right - menuWidth,
                                        (typeof window !== "undefined"
                                          ? window.innerWidth
                                          : 1200) -
                                          menuWidth -
                                          padding
                                      )
                                    ),
                                  });
                                  setShowCommunityMenu(
                                    isCommunityMenuOpen ? null : cardKey
                                  );
                                }}
                                className="p-1 rounded-full hover:bg-green-100 transition-colors"
                                aria-label="Assign community"
                                title="Assign community"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3.5 w-3.5 text-green-600"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                              </button>
                              {isCommunityMenuOpen && communityMenuPosition && (
                                <div
                                  className="fixed bg-white border border-gray-200 rounded-md shadow-xl z-[110] min-w-[140px] max-h-[200px] overflow-y-auto community-assignment-menu"
                                  style={{
                                    top: `${communityMenuPosition.top}px`,
                                    left: `${communityMenuPosition.left}px`,
                                    transform: "translateY(-100%)",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="py-1">
                                    {communities.length === 0 ? (
                                      <div className="px-3 py-2 text-xs text-gray-500">
                                        No communities created
                                      </div>
                                    ) : (
                                      <>
                                        {communities.map((community) => (
                                          <button
                                            key={community.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onAssignCommunityTrait(
                                                card,
                                                assignedCommunity ===
                                                  community.id
                                                  ? null
                                                  : community.id
                                              );
                                              setShowCommunityMenu(null);
                                              setCommunityMenuPosition(null);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors whitespace-nowrap ${
                                              assignedCommunity === community.id
                                                ? "bg-green-50 text-green-700 font-medium"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            {community.name}
                                          </button>
                                        ))}
                                        {assignedCommunity && (
                                          <>
                                            <div className="border-t border-gray-200 my-1" />
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onAssignCommunityTrait(
                                                  card,
                                                  null
                                                );
                                                setShowCommunityMenu(null);
                                                setCommunityMenuPosition(null);
                                              }}
                                              className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                                            >
                                              Remove assignment
                                            </button>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnpin(card);
                            }}
                            className="p-1 rounded-full hover:bg-yellow-200 transition-colors"
                            aria-label="Unpin card"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-yellow-600"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M16 12V4h1a2 2 0 0 0 0-4H7a2 2 0 1 0 0 4h1v8a2 2 0 0 1-2 2H5a2 2 0 0 0 0 4h14a2 2 0 0 0 0-4h-3a2 2 0 0 1-2-2zm-5-3V4h2v5a1 1 0 1 1-2 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {isIndividualTraits && assignedPlayer && (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {assignedPlayer}
                          </span>
                        </div>
                      )}
                      {!isIndividualTraits && assignedCommunity && (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {communities.find((c) => c.id === assignedCommunity)
                              ?.name || "Unknown"}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 truncate">
                        {card.deckTitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Expanded card overlay */}
      {expandedCardId && expandedPosition && expandedCard && (
        <div
          ref={expandedCardRef}
          className="fixed z-[100] w-64 animate-fade-in pointer-events-auto expanded-card-overlay"
          style={{
            left: `${expandedPosition.left}px`,
            bottom: `${expandedPosition.bottom}px`,
            transform: "translateX(-50%)",
            maxWidth: "min(calc(100vw - 2rem), 16rem)",
          }}
        >
          <Card
            card={expandedCard}
            onUnpin={() => {
              onUnpin(expandedCard);
              setExpandedCardId(null);
            }}
            isPinned={true}
            showPinButton={true}
          />
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M16 12V4h1a2 2 0 0 0 0-4H7a2 2 0 1 0 0 4h1v8a2 2 0 0 1-2 2H5a2 2 0 0 0 0 4h14a2 2 0 0 0 0-4h-3a2 2 0 0 1-2-2zm-5-3V4h2v5a1 1 0 1 1-2 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-700">
                Pinned Cards ({pinnedCards.length})
              </h3>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-red-700 font-medium">
                Extinction: <span className="font-bold">{extinctionValue}</span>
              </span>
              <span className="text-blue-700 font-medium">
                Civilization:{" "}
                <span className="font-bold">{civilizationValue}</span>
              </span>
            </div>
          </div>

          {/* Mobile: Tab Toggle */}
          <div className="md:hidden mb-3">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("individual")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "individual"
                    ? "text-yellow-600 border-b-2 border-yellow-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Individual Traits ({individualCards.length})
              </button>
              <button
                onClick={() => setActiveTab("community")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "community"
                    ? "text-yellow-600 border-b-2 border-yellow-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Community Traits ({communityCards.length})
              </button>
            </div>
          </div>

          {/* Desktop: Side by side, Mobile: Tabbed */}
          <div className="md:grid md:grid-cols-2 md:gap-4">
            {/* Individual Traits - Always visible on desktop, conditional on mobile */}
            <div
              className={`${
                activeTab === "individual" ? "block" : "hidden"
              } md:block`}
            >
              <h4 className="text-xs font-semibold text-gray-600 mb-2">
                Individual Traits ({individualCards.length})
              </h4>
              {renderCardContainer(
                individualCards,
                individualScrollRef,
                individualCanScrollLeft,
                individualCanScrollRight,
                "individual"
              )}
            </div>

            {/* Community Traits - Always visible on desktop, conditional on mobile */}
            <div
              className={`${
                activeTab === "community" ? "block" : "hidden"
              } md:block`}
            >
              <h4 className="text-xs font-semibold text-gray-600 mb-2">
                Community Traits ({communityCards.length})
              </h4>
              {renderCardContainer(
                communityCards,
                communityScrollRef,
                communityCanScrollLeft,
                communityCanScrollRight,
                "community"
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
