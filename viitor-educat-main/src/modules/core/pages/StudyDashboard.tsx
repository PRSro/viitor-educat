/**
 * Student Study Dashboard
 * Central hub for students to access lessons, articles, flashcards, and resources
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings, useFeatureEnabled } from '@/contexts/SettingsContext';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  getArticles,
  getLatestArticles,
  ArticleListItem
} from '@/modules/articles/services/articleService';
import {
  getResources,
  ResourceListItem
} from '@/modules/core/services/resourceService';
import {
  getFlashcards,
  FlashcardListItem
} from '@/modules/core/services/flashcardService';
import {
  getEnrolledLessons, // Changed to getEnrolledLessons
  LessonListItem
} from '@/modules/lessons/services/lessonService';
import { api } from '@/lib/apiClient';
import {
  GraduationCap,
  BookOpen,
  FileText,
  Link as LinkIcon,
  Layers,
  Play,
  Loader2,
  Clock,
  TrendingUp,
  Star,
  ArrowRight,
  User,
  ExternalLink,
  Settings,
  Terminal,
  ShieldAlert
} from 'lucide-react';

export default function StudyDashboard() {
  const { user } = useAuth();
  const { settings, isSettingsLoaded } = useSettings();

  // Feature toggles from settings
  const showArticles = useFeatureEnabled('showArticles');
  const showFlashcards = useFeatureEnabled('showFlashcards');
  const showResources = useFeatureEnabled('showResources');

  // Data states
  const [enrolledLessons, setEnrolledLessons] = useState<LessonListItem[]>([]);
  const [latestArticles, setLatestArticles] = useState<ArticleListItem[]>([]);
  const [recentResources, setRecentResources] = useState<ResourceListItem[]>([]);
  const [recentFlashcards, setRecentFlashcards] = useState<FlashcardListItem[]>([]);

  // CyberLab data
  const [cyberPoints, setCyberPoints] = useState(0);
  const [cyberSolved, setCyberSolved] = useState(0);
  const [cyberTotal, setCyberTotal] = useState(0);

  // Loading states
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingFlashcards, setLoadingFlashcards] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch all data in parallel
      const [lessonsData, articlesData, resourcesData, flashcardsData, cyberData] = await Promise.all([
        getEnrolledLessons(),
        getLatestArticles(),
        getResources({ limit: 6 }),
        getFlashcards({ limit: 6 }),
        api.get<{ challenges: any[], solvedIds: string[], userPoints: number }>('/api/cyberlab/challenges').catch(() => ({ challenges: [], solvedIds: [], userPoints: 0 }))
      ]);

      setEnrolledLessons(lessonsData);
      setLatestArticles(articlesData);
      setRecentResources(resourcesData.resources);
      setRecentFlashcards(flashcardsData.flashcards);
      setCyberPoints(cyberData.userPoints || 0);
      setCyberSolved(cyberData.solvedIds?.length || 0);
      setCyberTotal(cyberData.challenges?.length || 0);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoadingLessons(false);
      setLoadingArticles(false);
      setLoadingResources(false);
      setLoadingFlashcards(false);
    }
  }

  const isLoading = loadingLessons || loadingArticles || loadingResources || loadingFlashcards;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-sky-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="border-b bg-card/30 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Welcome back!
              </h1>
              <p className="text-muted-foreground mt-1">
                Continue your learning journey
              </p>
            </div>
            <div className="flex gap-2">
              <NotificationBell />
              <Link to="/settings">
                <Button variant="outline" className="aero-button">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link to="/student/articles">
                <Button variant="outline" className="aero-button">
                  <FileText className="h-4 w-4 mr-2" />
                  Articles
                </Button>
              </Link>
              <Link to="/student/resources">
                <Button variant="outline" className="aero-button">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Resources
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* My Lessons Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6" />
                  <h2 className="text-xl font-semibold">My Lessons</h2>
                </div>
                <Link to="/student">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {enrolledLessons.length === 0 ? (
                <Card className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Browse available lessons and start learning!
                  </p>
                  <Link to="/student">
                    <Button>Browse Lessons</Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {enrolledLessons.slice(0, 3).map((lesson) => (
                    <LessonProgressCard
                      key={lesson.id}
                      lesson={lesson}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Quick Access Grid */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Recent Articles */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    <h2 className="text-xl font-semibold">Recent Articles</h2>
                  </div>
                  <Link to="/student/articles">
                    <Button variant="ghost" size="sm">
                      View All <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                {latestArticles.length === 0 ? (
                  <Card className="p-8 text-center">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No articles available</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {latestArticles.slice(0, 3).map((article) => (
                      <Card key={article.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <Link to={`/articles/${article.id}`} className="hover:text-primary">
                            <CardTitle className="text-base line-clamp-1">{article.title}</CardTitle>
                          </Link>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {article.category}
                            </Badge>
                            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              {/* Recent Resources */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-6 w-6" />
                    <h2 className="text-xl font-semibold">Recent Resources</h2>
                  </div>
                  <Link to="/student/resources">
                    <Button variant="ghost" size="sm">
                      View All <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                {recentResources.length === 0 ? (
                  <Card className="p-8 text-center">
                    <LinkIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No resources available</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {recentResources.slice(0, 3).map((resource) => (
                      <Card key={resource.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <ExternalLink className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium line-clamp-1">{resource.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {resource.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {resource.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Flashcards Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Layers className="h-6 w-6" />
                  <h2 className="text-xl font-semibold">Flashcards</h2>
                  <Badge variant="secondary">{recentFlashcards.length} cards</Badge>
                </div>
                <Link to="/student/flashcards">
                  <Button variant="ghost" size="sm">
                    Study Now <Play className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {recentFlashcards.length === 0 ? (
                <Card className="p-8 text-center">
                  <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No flashcards yet</h3>
                  <p className="text-muted-foreground">
                    Flashcards will appear here when teachers create them
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {recentFlashcards.slice(0, 4).map((flashcard) => (
                    <Card key={flashcard.id} className="aero-glass p-4">
                      <div className="flex flex-col gap-2">
                        <p className="font-medium">{flashcard.question}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1 italic">{flashcard.answer}</p>
                        {flashcard.lesson && (
                          <Badge variant="outline" className="w-fit mt-2">
                            {flashcard.lesson.title}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Stats Section */}
            <section>
              <h2 className="text-xl font-semibold mb-6">Your Progress</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                  icon={BookOpen}
                  label="Enrolled Lessons"
                  value={enrolledLessons.length}
                  color="blue"
                />
                <StatCard
                  icon={FileText}
                  label="Articles Read"
                  value={latestArticles.length}
                  color="purple"
                />
                <StatCard
                  icon={LinkIcon}
                  label="Resources Available"
                  value={recentResources.length}
                  color="green"
                />
                <StatCard
                  icon={Layers}
                  label="Flashcards"
                  value={recentFlashcards.length}
                  color="orange"
                />
                <Link to="/cyberlab">
                  <Card className="aero-glass hover:shadow-lg transition-all cursor-pointer h-full">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                      <div className="p-3 rounded-xl bg-green-500/10 mb-3">
                        <Terminal className="h-6 w-6 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-green-400">{cyberPoints}</p>
                      <p className="text-sm text-muted-foreground">CyberLab XP</p>
                      <Badge variant="outline" className="mt-2 bg-black/20 text-green-400 border-green-500/30 text-xs">
                        {cyberSolved}/{cyberTotal} Solved
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>

            {/* CyberLab Quick Access */}
            {cyberTotal > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-6 w-6 text-green-500" />
                    <h2 className="text-xl font-semibold">CyberLab Challenges</h2>
                  </div>
                  <Link to="/cyberlab">
                    <Button variant="outline" className="bg-black/20 text-green-400 border-green-500/30 hover:bg-green-500/10">
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <Card className="bg-black border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-green-500/10 rounded-xl">
                          <ShieldAlert className="h-8 w-8 text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-green-400">CTF Challenges</h3>
                          <p className="text-sm text-green-100/60">Test your cybersecurity skills</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-400">{cyberSolved}</p>
                          <p className="text-xs text-green-100/50">Solved</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-100/50">{cyberPoints}</p>
                          <p className="text-xs text-green-100/30">XP</p>
                        </div>
                        <Link to="/cyberlab">
                          <Button className="bg-green-500 hover:bg-green-600 text-white">
                            Start Hacking
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Lesson Progress Card Component
function LessonProgressCard({ lesson }: { lesson: LessonListItem }) {
  const isCompleted = lesson.completed;
  const progress = isCompleted ? 100 : 0;

  return (
    <Card className="flex flex-col aero-glass hover:shadow-aero-strong transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{lesson.title}</CardTitle>
        {lesson.description && (
          <CardDescription className="line-clamp-2">
            {lesson.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">{isCompleted ? 'Completed' : 'In Progress'}</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted/50" />
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/lessons/${lesson.id}`} className="w-full">
          <Button className="w-full aero-button-accent">
            {isCompleted ? 'Review Lesson' : 'Start Learning'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Stats Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    green: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <Card className="aero-glass hover:shadow-aero-strong transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              {value}
            </p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
