import { RankingsResponse, PollWeek, Team, TeamRanking, Ranking, PollsterResponse, PollstersListResponse, PollsterVotesResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getCurrentRankings(region?: string): Promise<RankingsResponse> {
  const query = region && region !== "global" ? `?region=${region}` : "";
  return fetchAPI<RankingsResponse>(`/rankings/current${query}`);
}

export async function getWeekRankings(weekId: number): Promise<RankingsResponse> {
  return fetchAPI<RankingsResponse>(`/rankings/week/${weekId}`);
}

export async function getTeams(region?: string): Promise<Team[]> {
  const query = region ? `?region=${region}` : "";
  return fetchAPI<Team[]>(`/teams${query}`);
}

export async function getWeeks(year?: number, split?: string): Promise<PollWeek[]> {
  const params = new URLSearchParams();
  if (year) params.append("year", year.toString());
  if (split) params.append("split", split);
  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchAPI<PollWeek[]>(`/weeks${query}`);
}

export async function submitVote(
  pollWeekId: number,
  voterId: number,
  rankings: TeamRanking[]
): Promise<void> {
  return fetchAPI("/votes", {
    method: "POST",
    body: JSON.stringify({ pollWeekId, voterId, rankings }),
  });
}

export async function calculateRankings(pollWeekId: number): Promise<Ranking[]> {
  return fetchAPI<Ranking[]>("/rankings/calculate", {
    method: "POST",
    body: JSON.stringify({ pollWeekId }),
  });
}

export interface LoginResponse {
  voter: {
    id: number;
    name: string;
    email: string;
    region: string;
  };
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return fetchAPI<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getPollsters(page: number = 1, limit: number = 20): Promise<PollstersListResponse> {
  return fetchAPI<PollstersListResponse>(`/pollsters?page=${page}&limit=${limit}`);
}

export async function getPollster(id: number): Promise<PollsterResponse> {
  return fetchAPI<PollsterResponse>(`/pollsters/${id}`);
}

export async function getPollsterVotes(id: number, page: number = 1, limit: number = 10): Promise<PollsterVotesResponse> {
  return fetchAPI<PollsterVotesResponse>(`/pollsters/${id}/votes?page=${page}&limit=${limit}`);
}
