import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Lesson,
  getTeacherLessons,
  createLesson,
  updateLesson,
  deleteLesson,
} from '@/modules/lessons/services/lessonService';
import { getTeacherArticles, uploadArticleFile, uploadLessonMaterial, TeacherLesson } from '@/modules/core/services/authService';
import { ArticleListItem, ArticleCategory, createArticle, getArticles, categoryLabels } from '@/modules/articles/services/articleService';
import { 
  getLessonCompletionRates, 
  getWeeklyActiveStudents, 
  getQuizPerformance, 
  LessonCompletionResponse,
  WeeklyActiveResponse,
  QuizPerformanceResponse,
  getTeacherOverview,
  TeacherOverview
} from '@/modules/core/services/analyticsService';
import { sanitizeInput, containsXssPatterns } from '@/lib/sanitize';
import { lessonSchema, getFirstError } from '@/lib/validation';
import { NotificationBell } from '@/components/NotificationBell';
import { StudentProgressPanel } from '@/components/StudentProgressPanel';
import { api } from '@/lib/apiClient';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  User, 
  GraduationCap,
  FileText,
  Eye,
  EyeOff,
  Settings,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Search,
  BookOpen,
  Trophy,
  Users as UsersIcon
} from 'lucide-react';
import { Leaderboard } from '@/components/Leaderboard';
import { TeacherClassrooms } from '@/components/TeacherClassrooms';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme } = useSettings();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [articleFormOpen, setArticleFormOpen] = useState(false);
  const [articleFormData, setArticleFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'GENERAL' as ArticleCategory,
    file: null as File | null
  });
  const [articleSaving, setArticleSaving] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Analytics state
  const [overview, setOverview] = useState<TeacherOverview | null>(null);
  const [lessonCompletions, setLessonCompletions] = useState<LessonCompletionResponse | null>(null);
  const [weeklyActive, setWeeklyActive] = useState<WeeklyActiveResponse | null>(null);
  const [quizPerformance, setQuizPerformance] = useState<QuizPerformanceResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [lessonsData, articlesData, overviewData] = await Promise.all([
          getTeacherLessons(user.id),
          getTeacherArticles(user.id).catch(() => []),
          getTeacherOverview().catch(() => null)
        ]);
        setLessons(lessonsData || []);
        setArticles(articlesData || []);
        setOverview(overviewData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.id]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchDetailedAnalytics();
    }
  }, [activeTab]);

  async function fetchDetailedAnalytics() {
    try {
      setLoadingAnalytics(true);
      const [completions, active, quizzes] = await Promise.all([
        getLessonCompletionRates(1, 10),
        getWeeklyActiveStudents(8),
        getQuizPerformance(1, 10)
      ]);
      setLessonCompletions(completions);
      setWeeklyActive(active);
      setQuizPerformance(quizzes);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load detailed analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function handleDeleteLesson(id: string) {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await deleteLesson(id);
      setLessons(lessons.filter(l => l.id !== id));
      setSuccess('Lesson deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson');
    }
  }

  async function handleArticleSubmit() {
    if (!articleFormData.file && !articleFormData.content) {
      setFileError('Please upload a .docx file or enter content manually');
      return;
    }

    try {
      setArticleSaving(true);
      setError(null);

      let content = articleFormData.content;
      let title = articleFormData.title;

      if (articleFormData.file) {
        const result = await uploadArticleFile(articleFormData.file);
        content = result.content;
        title = result.title || articleFormData.title;
      }

      await createArticle({
        title: title || 'Untitled Article',
        content,
        excerpt: articleFormData.excerpt || content.substring(0, 200),
        category: articleFormData.category
      });

      const updatedArticles = await getTeacherArticles(user.id);
      setArticles(updatedArticles);
      setArticleFormOpen(false);
      setSuccess('Article published successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish article');
    } finally {
      setArticleSaving(false);
    }
  }

  async function handleDeleteArticle(id: string) {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const { deleteArticle } = await import('@/modules/articles/services/articleService');
      await deleteArticle(id);
      setArticles(articles.filter(a => a.id !== id));
      setSuccess('Article deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: 'article' | 'lesson') {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    if (type === 'article') {
      if (!file.name.endsWith('.docx')) {
        setFileError('Articles must be uploaded as .docx files only');
        return;
      }
      setArticleFormData(prev => ({ ...prev, file }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-sky-400/5 rounded-full blur-3xl" />
      </div>

      <header className="border-b aero-panel relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Teacher Dashboard</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm">Home</Button>
              </Link>
              <NotificationBell />
              <Link to="/profile">
                <Button variant="outline" size="sm" className="aero-button">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="outline" size="sm" className="aero-button">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout} className="hover:bg-destructive/10">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="aero-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lessons</p>
                  <p className="text-2xl font-bold">{lessons.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="aero-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Articles</p>
                  <p className="text-2xl font-bold">{articles.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="aero-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Completion</p>
                  <p className="text-2xl font-bold">{overview?.completionRate || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="aero-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{overview?.students || 0}</p>
                </div>
                <UsersIcon className="h-8 w-8 text-purple-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="aero-glass p-1 flex-wrap">
            <TabsTrigger value="overview">My Lessons</TabsTrigger>
            <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
            <TabsTrigger value="articles">My Articles</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="progress">Student Progress</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Lessons</h2>
              <Button 
                className="aero-button-accent gap-2"
                onClick={() => navigate('/lessons/new')}
              >
                <Plus className="h-4 w-4" />
                New Lesson
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(lessons ?? []).map(lesson => (
                <Card key={lesson.id} className="aero-glass hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-1">{lesson.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{lesson.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between">
                    <div className="flex gap-2">
                       <Button size="sm" variant="ghost" asChild>
                         <Link to={`/lessons/${lesson.id}/edit`}>
                           <Edit className="h-4 w-4" />
                         </Link>
                       </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/lessons/${lesson.id}`}>
                        View
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="articles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Articles</h2>
              <Button onClick={() => setArticleFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Article
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(articles ?? []).map(article => (
                <Card key={article.id} className="aero-glass">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{article.category}</Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteArticle(article.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2 line-clamp-1">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{article.excerpt}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/articles/${article.id}`}>View Article</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <Dialog open={articleFormOpen} onOpenChange={setArticleFormOpen}>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>New Article</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Article Source</Label>
                    <div className="flex gap-4 p-4 border rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Manual Entry</p>
                        <p className="text-xs text-muted-foreground">Type or paste content directly</p>
                      </div>
                      <div className="flex-1 border-l pl-4">
                        <p className="text-sm font-medium mb-1">Import DOCX</p>
                        <p className="text-xs text-muted-foreground">Automated content extraction</p>
                        <Input 
                          type="file" 
                          accept=".docx" 
                          onChange={e => handleFileChange(e, 'article')}
                          className="mt-2 text-xs" 
                        />
                        {fileError && <p className="text-[10px] text-destructive mt-1">{fileError}</p>}
                      </div>
                    </div>
                  </div>
                  {!articleFormData.file && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="art-title">Title</Label>
                        <Input 
                          id="art-title"
                          value={articleFormData.title}
                          onChange={e => setArticleFormData({...articleFormData, title: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="art-content">Content (HTML/Rich Text)</Label>
                        <Textarea 
                          id="art-content" 
                          className="h-64"
                          value={articleFormData.content}
                          onChange={e => setArticleFormData({...articleFormData, content: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleArticleSubmit} disabled={articleSaving}>
                    {articleSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Publish Article
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="aero-glass">
                <CardHeader>
                  <CardTitle>Completion Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyActive?.weeklyActive || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="weekStart" tick={{fontSize: 12}} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="activeStudents" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="aero-glass">
                <CardHeader>
                  <CardTitle>Lesson Completions</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lessonCompletions?.lessons || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" hide />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <StudentProgressPanel lessons={(lessons ?? []).map((l: any) => ({ id: l.id, title: l.title }))} />
          </TabsContent>

          <TabsContent value="classrooms" className="space-y-4">
            <TeacherClassrooms />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
