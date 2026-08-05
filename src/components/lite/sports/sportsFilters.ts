// ============================================================
// SPORTS DIMENSION FILTERS — SPORT row + LEAGUE row.
// Contract: docs/design-contracts/sports-subnav-13.html (13A).
//
// Options and ORDER come from src/lib/taxonomy.ts. Nothing here
// hardcodes a sport or a league: a node exists only when live
// markets exist for it (live = in play OR still to kick off).
// Esports is flattened two levels — the LoL parent is never used.
// ============================================================
import {
  SPORTS_GROUPS,
  leagueCodeFor,
  leagueNode,
  sportGroupFor,
  type LeagueNode,
  type SportGroup,
} from "@/lib/taxonomy";
import { isUpcoming, type SportsMatch } from "./sportsData";

export const ALL_OPTION = "all";

/** Matches that count towards "markets this week". */
export const marketable = (matches: SportsMatch[], now?: number) =>
  matches.filter((m) => m.live || isUpcoming(m, now ?? Date.now()));

/** Taxonomy league code for a match ("EPL"), null when unmapped. */
export const leagueCodeOf = (m: SportsMatch) => leagueCodeFor(m.league);

/** Taxonomy sport group code for a match ("SOCCER"), null when unmapped. */
export const sportCodeOf = (m: SportsMatch): string | null =>
  sportGroupFor(leagueCodeOf(m))?.code ?? null;

/** Sport groups that currently have markets — taxonomy order. */
export const sportOptions = (
  matches: SportsMatch[],
  now?: number,
): SportGroup[] => {
  const live = new Set(
    marketable(matches, now)
      .map(sportCodeOf)
      .filter((c): c is string => !!c),
  );
  return SPORTS_GROUPS.filter((g) => live.has(g.code));
};

/** Leagues with markets inside one sport group — taxonomy order. */
export const leagueOptions = (
  matches: SportsMatch[],
  groupCode: string,
  now?: number,
): LeagueNode[] => {
  const group = SPORTS_GROUPS.find((g) => g.code === groupCode);
  if (!group) return [];
  const live = new Set(
    marketable(matches, now)
      .filter((m) => sportCodeOf(m) === groupCode)
      .map(leagueCodeOf)
      .filter((c): c is string => !!c),
  );
  return group.leagues.filter((l) => live.has(l.code));
};

/** Narrow the match pool by the selected sport + league. */
export const filterMatches = (
  matches: SportsMatch[],
  sport: string,
  league: string,
): SportsMatch[] =>
  matches.filter((m) => {
    if (sport !== ALL_OPTION && sportCodeOf(m) !== sport) return false;
    if (league !== ALL_OPTION && leagueCodeOf(m) !== league) return false;
    return true;
  });

export const sportLabel = (code: string): string =>
  SPORTS_GROUPS.find((g) => g.code === code)?.label ?? "";

export const leagueLabelOf = (code: string): string => leagueNode(code)?.label ?? "";

/** "Basketball, UFC and Esports" — other groups that still have matches. */
export const otherGroupsSummary = (
  matches: SportsMatch[],
  sport: string,
  now?: number,
): { count: number; labels: string } => {
  if (sport === ALL_OPTION) return { count: 0, labels: "" };
  const rest = marketable(matches, now).filter((m) => sportCodeOf(m) !== sport);
  const labels = SPORTS_GROUPS.filter((g) =>
    rest.some((m) => sportCodeOf(m) === g.code),
  ).map((g) => g.label);
  const joined =
    labels.length <= 1
      ? labels.join("")
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
  return { count: rest.length, labels: joined };
};
