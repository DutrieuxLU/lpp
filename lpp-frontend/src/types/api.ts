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

export interface PollsterProfile {
  id: number;
  name: string;
  outlet: string;
  region: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface PollsterTeamRanking {
  teamId: number;
  rank: number;
  teamName: string;
  teamShort: string;
  teamLogo: string;
  teamRegion: string;
}

export interface PollsterVote {
  id: number;
  pollWeekId: number;
  pollWeek: string;
  weekNumber: number;
  split: string;
  year: number;
  rankings: PollsterTeamRanking[];
  submittedAt: string;
}

export interface PollsterResponse {
  pollster: PollsterProfile;
  latestVote?: PollsterVote;
}

export interface PollstersListResponse {
  pollsters: PollsterProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PollsterVotesResponse {
  votes: PollsterVote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
