import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal, BookOpen, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface CyberLabLesson {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: 'lesson' | 'challenge';
  points?: number;
  difficulty?: string;
  challengeUrl: string;
}

interface CyberLabLessonsResponse {
  ctfLessons: CyberLabLesson[];
  totalChallenges: number;
}

export function CyberLabLessonsPage() {
  const [lessons, setLessons] = useState<CyberLabLesson[]>([]);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLessons = async () => {
      try {
        const res = await api.get<CyberLabLessonsResponse>('/api/lessons/cyberlab');
        setLessons(res.ctfLessons);
        setTotalChallenges(res.totalChallenges);
      } catch (err) {
        console.error("Failed to load CyberLab lessons", err);
      } finally {
        setLoading(false);
      }
    };
    loadLessons();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Banner */}
        <div className="relative bg-black/80 rounded-xl overflow-hidden shadow-2xl border border-green-500/20" data-card="true">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent" />
          <div className="relative z-10 p-8 md:p-12 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-green-500/10 rounded-full mb-4 ring-1 ring-green-500/30">
              <ShieldAlert className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 mb-4 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] tracking-tight">
              CyberLab Training
            </h1>
            <p className="text-lg text-green-100/70 max-w-2xl font-mono">
              Learn cybersecurity fundamentals through interactive lessons before tackling real challenges.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-black/60 border-green-500/20">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-400">{lessons.length}</p>
              <p className="text-sm text-muted-foreground">Training Lessons</p>
            </CardContent>
          </Card>
          <Card className="bg-black/60 border-green-500/20">
            <CardContent className="p-6 text-center">
              <Terminal className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-400">{totalChallenges}</p>
              <p className="text-sm text-muted-foreground">Available Challenges</p>
            </CardContent>
          </Card>
          <Card className="bg-black/60 border-green-500/20">
            <CardContent className="p-6 text-center">
              <ShieldAlert className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-400">Beginner</p>
              <p className="text-sm text-muted-foreground">Recommended Start</p>
            </CardContent>
          </Card>
        </div>

        {/* Lessons Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-green-400">Training Modules</h2>
          
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Terminal className="w-12 h-12 mx-auto mb-4 animate-pulse opacity-50" />
              <p>Loading training modules...</p>
            </div>
          ) : lessons.length === 0 ? (
            <Card className="p-12 text-center bg-black/40 border-green-500/10">
              <BookOpen className="h-12 w-12 mx-auto text-green-400/40 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-green-400">No training modules available</h3>
              <p className="text-muted-foreground mb-4">
                Check back later for new cybersecurity training content.
              </p>
              <Button asChild className="bg-green-500 hover:bg-green-600 text-black font-semibold">
                <Link to="/student/cyberlab_challenges">
                  <Terminal className="h-4 w-4 mr-2" />
                  Go to Challenges
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => (
                <Card 
                  key={lesson.id} 
                  className="bg-black/60 border-green-500/20 hover:border-green-500/40 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="bg-black/40 text-green-400 border-green-500/30">
                        {lesson.category}
                      </Badge>
                      {lesson.difficulty && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {lesson.difficulty}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="group-hover:text-green-400 transition-colors line-clamp-1 text-green-400">
                      {lesson.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-muted-foreground">
                      {lesson.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold">
                      <Link to={`/lessons/${lesson.id}`}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Start Training Module
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* CTA to Challenges */}
        <div className="mt-12 p-8 bg-black/60 rounded-xl border border-green-500/20 text-center">
          <Terminal className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-400 mb-2">Ready to Test Your Skills?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Once you've completed the training modules, head over to the challenges to apply what you've learned.
          </p>
          <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 text-black font-semibold">
            <Link to="/student/cyberlab_challenges">
              <Terminal className="h-5 w-5 mr-2" />
              Go to Challenges
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
