import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, BookOpen, CheckCircle } from 'lucide-react';

interface LessonStat {
  lessonId: string;
  lessonTitle: string;
  viewCount: number;
  completionCount: number;
  completionRate: number;
}

export function StudentProgressPanel({ lessons }: { lessons: { id: string; title: string }[] }) {
  const [stats, setStats] = useState<LessonStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<{ stats: LessonStat[] }>('/analytics/teacher/lessons');
        setStats(data.stats);
      } catch {
        // Fallback: show lessons with 0 data if endpoint not yet implemented
        setStats(lessons.map(l => ({
          lessonId: l.id,
          lessonTitle: l.title,
          viewCount: 0,
          completionCount: 0,
          completionRate: 0,
        })));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [lessons]);

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div className="space-y-3">
      {stats.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No lesson data yet.</p>
      ) : (
        stats.map(stat => (
          <div key={stat.lessonId} className="aero-glass p-4 rounded-xl flex items-center gap-4">
            <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{stat.lessonTitle}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {stat.viewCount} views
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {stat.completionCount} completed
                </span>
              </div>
              <Progress value={stat.completionRate} className="h-1.5 mt-2" />
            </div>
            <Badge variant="outline">{stat.completionRate.toFixed(0)}%</Badge>
          </div>
        ))
      )}
    </div>
  );
}
