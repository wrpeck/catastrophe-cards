"use client";

import { ReactNode } from "react";

export type DeckTab =
  | "individualEvent"
  | "communityEvent"
  | "individualTraits"
  | "communityTraits"
  | "desperateMeasures"
  | "wanderer";

interface DeckTabsProps {
  activeTab: DeckTab;
  onTabChange: (tab: DeckTab) => void;
  children: {
    individualEvent: ReactNode;
    communityEvent: ReactNode;
    individualTraits: ReactNode;
    communityTraits: ReactNode;
    desperateMeasures: ReactNode;
    wanderer: ReactNode;
  };
}

export default function DeckTabs({
  activeTab,
  onTabChange,
  children,
}: DeckTabsProps) {
  const individualTabs = [
    { id: "individualEvent" as DeckTab, label: "Individual Event" },
    { id: "individualTraits" as DeckTab, label: "Individual Traits" },
    { id: "wanderer" as DeckTab, label: "Wanderer" },
  ];

  const communityTabs = [
    { id: "communityEvent" as DeckTab, label: "Community Event" },
    { id: "communityTraits" as DeckTab, label: "Community Traits" },
    { id: "desperateMeasures" as DeckTab, label: "Desperate Measures" },
  ];

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 items-center justify-center">
        {/* Individual Tabs */}
        <div className="flex gap-2">
          {individualTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visual Separator */}
        <div className="border-l-2 border-gray-300 h-8 mx-4" />

        {/* Community Tabs */}
        <div className="flex gap-2">
          {communityTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deck Content - All decks remain mounted to preserve state */}
      <div className="relative">
        <div className={activeTab === "individualEvent" ? "block" : "hidden"}>
          {children.individualEvent}
        </div>
        <div className={activeTab === "communityEvent" ? "block" : "hidden"}>
          {children.communityEvent}
        </div>
        <div className={activeTab === "individualTraits" ? "block" : "hidden"}>
          {children.individualTraits}
        </div>
        <div className={activeTab === "communityTraits" ? "block" : "hidden"}>
          {children.communityTraits}
        </div>
        <div className={activeTab === "desperateMeasures" ? "block" : "hidden"}>
          {children.desperateMeasures}
        </div>
        <div className={activeTab === "wanderer" ? "block" : "hidden"}>
          {children.wanderer}
        </div>
      </div>
    </div>
  );
}
