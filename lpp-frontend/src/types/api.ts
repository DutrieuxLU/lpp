export interface Team {
  id: number;
  name: string;
  shortName: string;
  region: string;
  logo: string;
  externalId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PollWeek {
  id: number;
  year: number;
  split: "spring" | "summer";
  weekNumber: number;
  publishDate: string;
  status: "open" | "closed" | "published";
  createdAt: string;
  updatedAt: string;
}

export interface Ranking {
  rank: number;
  points: number;
  firstPlaceVotes: number;
  team: Team;
}

export interface RankingsResponse {
  pollWeek: PollWeek;
  rankings: Ranking[];
}

export interface TeamRanking {
  teamId: number;
  rank: number;
}

export interface VoteSubmission {
  pollWeekId: number;
  voterId: number;
  rankings: TeamRanking[];
}
