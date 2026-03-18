import { api } from '@/lib/apiClient';

export interface LeaderboardEntry {
  userId: string;
  total: number;
  weekly: number;
  monthly: number;
  streak: number;
  user: {
    id: string;
    email: string;
    studentProfile?: { avatarUrl?: string | null } | null;
    teacherProfile?: { pictureUrl?: string | null } | null;
  };
}

export interface UserPoints {
  totalPoints: number;
  level: number;
}

export const pointsService = {
  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const { leaderboard } = await api.get<{ leaderboard: LeaderboardEntry[] }>('/leaderboard');
    return leaderboard;
  },

  getMyPoints: async (): Promise<UserPoints> => {
    const data = await api.get<{ rank: number | null; points: number }>('/leaderboard/me');
    return { totalPoints: data.points, level: Math.floor(data.points / 500) + 1 };
  }
};


