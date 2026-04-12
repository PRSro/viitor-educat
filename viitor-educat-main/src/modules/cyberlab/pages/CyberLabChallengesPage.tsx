import React, { useEffect, useState } from 'react';
import { ChallengeCard, Challenge } from '../components/ChallengeCard';
import { Card } from '@/components/ui/card';
import { ShieldAlert, Terminal, Award, Target } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';

export function CyberLabChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const res = await api.get<{ challenges: Challenge[], solvedIds: string[], userPoints: number }>('/api/cyberlab/challenges');
        setChallenges(res.challenges);
        setSolvedIds(new Set(res.solvedIds));
        setPoints(res.userPoints);
      } catch (err) {
        console.error("Failed to load CyberLab challenges", err);
        toast.error("Failed to load challenges");
      }
    };
    loadChallenges();
  }, []);

  const handleSolve = async (id: string, flag: string) => {
    try {
      const res = await api.post<{ correct: boolean, pointsAwarded: number, alreadySolved: boolean }>(`/api/cyberlab/challenges/${id}/submit`, { flag });
      if (res.correct) {
        if (!res.alreadySolved) {
          setPoints(prev => prev + res.pointsAwarded);
          setSolvedIds(prev => new Set(prev).add(id));
          toast.success(`Access Granted! Flag correct. +${res.pointsAwarded} points.`);
        } else {
          toast.success("Correct pointer, but you've already solved this one!");
        }
        return true;
      } else {
        toast.error("Access Denied. Incorrect flag.");
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || "Network intrusion attempt failed.");
      return false;
    }
  };

  const categories = Array.from(new Set(challenges.map(c => c.category)));

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Banner */}
        <div className="relative bg-black/80 rounded-xl overflow-hidden shadow-2xl border border-green-500/20" data-card="true">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent" />
          <div className="relative z-10 p-8 md:p-12 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-green-500/10 rounded-full mb-4 ring-1 ring-green-500/30">
              <Terminal className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 mb-4 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] tracking-tight">
              CyberLab Challenges
            </h1>
            <p className="text-lg text-green-100/70 max-w-2xl font-mono">
              Execute commands, decode intercept data, and exploit vulnerabilities in our secure sandbox environment.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content: Challenges Grid */}
          <div className="lg:col-span-3 space-y-12">
            {categories.map(category => {
              const catChalls = challenges.filter(c => c.category === category);
              return (
                <section key={category} className="space-y-4">
                  <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
                    <ShieldAlert className="w-5 h-5 text-green-400" />
                    <h2 className="text-2xl font-bold tracking-tight">{category} Challenges</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catChalls.map(challenge => (
                      <ChallengeCard 
                        key={challenge.id} 
                        challenge={challenge} 
                        solved={solvedIds.has(challenge.id)}
                        onSolve={(flag) => handleSolve(challenge.id, flag)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            
            {challenges.length === 0 && (
              <div className="text-center py-24 text-muted-foreground">
                <Terminal className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Initializing operations... please stand by.</p>
              </div>
            )}
          </div>

          {/* Sidebar: Dashboard / User Stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card data-card="true" className="p-6 sticky top-24 border-green-500/20 bg-black/60 backdrop-blur-sm">
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2 text-green-400">
                <Target className="w-5 h-5" /> Operator Status
              </h3>
              
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Total Score</span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black tracking-tight text-green-400">{points}</span>
                    <span className="text-sm text-muted-foreground font-mono mb-1">XP</span>
                  </div>
                </div>
                
                <div className="h-px w-full bg-green-500/20" />
                
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Challenges Cleared</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-400">{solvedIds.size}</span>
                    <span className="text-muted-foreground text-sm">/ {challenges.length}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-green-500/20">
                  <div className="p-4 bg-green-500/5 rounded-lg flex items-start gap-3 border border-green-500/10">
                    <Award className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1 text-green-400">Global Leaderboard</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your score contributes to your global rank. Keep finding flags to rise to the top!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
}
