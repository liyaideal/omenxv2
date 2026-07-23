// Hardcoded featured matches for the World Cup floating panel.
// Will be swapped for a fetch to OmenX Sports' public matches endpoint in a follow-up.

export type FlagColor = { primary: string; secondary?: string };

export type LiveMatch = {
  kind: "live";
  home: string;
  homeShort: string;
  away: string;
  awayShort: string;
  homeFlag: FlagColor;
  awayFlag: FlagColor;
  scoreHome: number;
  scoreAway: number;
  minute: string; // e.g. "72'"
};

export type UpcomingMatch = {
  kind: "upcoming";
  home: string;
  homeShort: string;
  away: string;
  awayShort: string;
  homeFlag: FlagColor;
  awayFlag: FlagColor;
  odds: string; // headline odds, e.g. "+142"
  time: string; // "IN 14M" or "22:00"
};

export type FeaturedMatch = LiveMatch | UpcomingMatch;

export const featuredMatches: FeaturedMatch[] = [
  {
    kind: "live",
    home: "Mexico",
    homeShort: "MEX",
    away: "S. Africa",
    awayShort: "RSA",
    homeFlag: { primary: "#006341" },
    awayFlag: { primary: "#007A4D" },
    scoreHome: 1,
    scoreAway: 0,
    minute: "72'",
  },
  {
    kind: "upcoming",
    home: "Argentina",
    homeShort: "ARG",
    away: "Canada",
    awayShort: "CAN",
    homeFlag: { primary: "#75AADB" },
    awayFlag: { primary: "#D52B1E" },
    odds: "+142",
    time: "IN 14M",
  },
  {
    kind: "upcoming",
    home: "France",
    homeShort: "FRA",
    away: "Spain",
    awayShort: "ESP",
    homeFlag: { primary: "#0055A4" },
    awayFlag: { primary: "#F1BF00" },
    odds: "+205",
    time: "22:00",
  },
];
