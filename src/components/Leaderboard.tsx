import { useQuery } from '@tanstack/react-query';
import { pointsService } from '@/modules/core/services/pointsService';
import { Trophy, Star, Medal, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaderboardEntry {
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

export function Leaderboard() {
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: pointsService.getLeaderboard,
  });

  const { data: myPoints } = useQuery({
    queryKey: ['myPoints'],
    queryFn: pointsService.getMyPoints,
  });

  if (isLoading) {
    return (
      <Card className="border-white/20 bg-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Top Studenți</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/20 bg-red-500/10 backdrop-blur-md">
        <CardContent className="pt-6">
          <p className="text-sm text-red-500">Failed to load leaderboard data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/20 bg-white/10 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Clasament
            </CardTitle>
            <CardDescription className="text-gray-300">
              Cei mai buni studenți de pe platformă
            </CardDescription>
          </div>
          {myPoints && (
            <div className="text-right">
              <div className="text-sm text-gray-400">Punctele tale</div>
              <div className="flex items-center gap-1 text-lg font-bold text-emerald-400">
                <Star className="h-4 w-4" />
                {myPoints.totalPoints} <span className="text-xs text-gray-300 font-normal"> (Nivelul {myPoints.level})</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard?.map((entry, idx) => {
            const avatarUrl = entry.user.studentProfile?.avatarUrl ?? entry.user.teacherProfile?.pictureUrl ?? null;
            const username = entry.user.email.split('@')[0];
            const level = Math.floor(entry.total / 500) + 1;
            return (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  idx === 0 ? 'bg-yellow-500/10 border-yellow-500/20' :
                  idx === 1 ? 'bg-slate-300/10 border-slate-300/20' :
                  idx === 2 ? 'bg-amber-700/10 border-amber-700/20' :
                  'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`font-bold text-lg w-6 text-center ${
                    idx === 0 ? 'text-yellow-400' :
                    idx === 1 ? 'text-slate-300' :
                    idx === 2 ? 'text-amber-600' :
                    'text-gray-400'
                  }`}>
                    {idx < 3 ? <Medal className="h-5 w-5 mx-auto" /> : `#${idx + 1}`}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center overflow-hidden shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={entry.user.email} className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-100 flex items-center gap-2">
                        {username}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Nivelul {level}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  {entry.total}
                  <Star className="h-4 w-4" />
                </div>
              </div>
            );
          })}

          {(!leaderboard || leaderboard.length === 0) && (
            <div className="text-center py-8 text-gray-400">
              Nu există date în clasament încă. Fii primul!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

