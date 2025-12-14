import { Card } from "@/types/card";
import { Community } from "@/types/gameState";

/**
 * Get all individual traits assigned to members of a community
 * @param community The community to check
 * @param cardPlayerAssignments Map of card keys to player names
 * @param pinnedCards All pinned cards
 * @param individualTraitCards All individual trait card definitions
 * @returns Array of trait cards assigned to community members
 */
export function getCommunityMemberTraits(
  community: Community,
  cardPlayerAssignments: Map<string, string>,
  pinnedCards: Array<Card & { deckTitle: string; pinnedId: string }>,
  individualTraitCards: Card[]
): Card[] {
  const memberTraits: Card[] = [];

  community.memberPlayerNames.forEach((memberName) => {
    // Find all individual traits assigned to this member
    cardPlayerAssignments.forEach((assignedPlayerName, cardKey) => {
      if (assignedPlayerName === memberName) {
        // Find the pinned card
        const pinnedCard = pinnedCards.find(
          (card) =>
            card.pinnedId === cardKey && card.deckTitle === "Individual Traits"
        );
        if (pinnedCard) {
          memberTraits.push(pinnedCard);
        }
      }
    });
  });

  return memberTraits;
}

/**
 * Calculate community upkeep cost considering individual trait effects
 * @param community The community
 * @param communityCostPerMember Base cost per member
 * @param cardPlayerAssignments Map of card keys to player names
 * @param pinnedCards All pinned cards
 * @param individualTraitCards All individual trait card definitions
 * @returns The calculated upkeep cost
 */
export function calculateCommunityUpkeepCost(
  community: Community,
  communityCostPerMember: number,
  cardPlayerAssignments: Map<string, string>,
  pinnedCards: Array<Card & { deckTitle: string; pinnedId: string }>,
  individualTraitCards: Card[]
): number {
  const baseCost = community.memberPlayerNames.length * communityCostPerMember;

  // Get all individual traits for community members
  const memberTraits = getCommunityMemberTraits(
    community,
    cardPlayerAssignments,
    pinnedCards,
    individualTraitCards
  );

  // Count Self-Sufficient traits
  const selfSufficientCount = memberTraits.filter(
    (trait) => trait.displayName === "Self-Sufficient"
  ).length;

  // Count Helpless traits
  const helplessCount = memberTraits.filter(
    (trait) => trait.displayName === "Helpless"
  ).length;

  // Each Self-Sufficient member reduces upkeep by 1 x communityCostPerMember
  const reduction = selfSufficientCount * communityCostPerMember;

  // Each Helpless member increases upkeep by 1 x communityCostPerMember (+1 member for upkeep)
  const helplessIncrease = helplessCount * communityCostPerMember;

  // Calculate final cost (minimum 1 member worth of cost)
  const finalCost = Math.max(
    communityCostPerMember, // Minimum 1 member
    baseCost - reduction + helplessIncrease
  );

  return finalCost;
}

/**
 * Get the number of Efficient traits in a community
 * @param community The community to check
 * @param cardPlayerAssignments Map of card keys to player names
 * @param pinnedCards All pinned cards
 * @returns Number of Efficient traits
 */
export function getEfficientTraitCount(
  community: Community,
  cardPlayerAssignments: Map<string, string>,
  pinnedCards: Array<Card & { deckTitle: string; pinnedId: string }>
): number {
  const memberTraits = getCommunityMemberTraits(
    community,
    cardPlayerAssignments,
    pinnedCards,
    [] // individualTraitCards not needed for this check
  );

  return memberTraits.filter((trait) => trait.displayName === "Efficient")
    .length;
}

/**
 * Calculate trait cost reduction from Efficient trait
 * @param community The community (if it's a community's turn)
 * @param cardPlayerAssignments Map of card keys to player names
 * @param pinnedCards All pinned cards
 * @returns Cost reduction amount (each Efficient member reduces by 2)
 */
export function getEfficientTraitCostReduction(
  community: Community | null,
  cardPlayerAssignments: Map<string, string>,
  pinnedCards: Array<Card & { deckTitle: string; pinnedId: string }>
): number {
  if (!community) {
    return 0;
  }

  const efficientCount = getEfficientTraitCount(
    community,
    cardPlayerAssignments,
    pinnedCards
  );

  // Each Efficient member reduces cost by 2
  return efficientCount * 2;
}
