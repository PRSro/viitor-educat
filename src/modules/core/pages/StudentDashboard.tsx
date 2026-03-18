/**
 * Enhanced Student Dashboard
 * 
 * Features:
 * - Articles section with category filtering and search
 * - Standalone lessons browsing
 * - Saved content (bookmarks)
 * - Responsive design with tabs navigation
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings, useFeatureEnabled } from '@/contexts/SettingsContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SafeHtml } from '@/components/SafeHtml';
import { NotificationBell } from '@/components/NotificationBell';
import {
  BookOpen,
  FileText,
  Search,
  ExternalLink,
  GraduationCap,
  Clock,
  User,
  Users,
  Settings,
  Bookmark as BookmarkIcon,
  Trash2,
  FolderOpen,
  Trophy
} from 'lucide-react';
import { Leaderboard } from '@/components/Leaderboard';
import { StudentClassrooms } from '@/components/StudentClassrooms';
import { LessonCollections } from '@/components/LessonCollections';
import { getStudentProgress } from '@/modules/core/services/studentService';
import { getAllTeachers, TeacherWithProfile } from '@/modules/core/services/authService';
import { getLessons, Lesson } from '@/modules/lessons/services/lessonService';
import {
  getArticles,
  ArticleListItem,
  ArticleCategory,
  ArticleFilters,
  categoryLabels,
  categoryColors
} from '@/modules/articles/services/articleService';
import { getBookmarks, deleteBookmarkByResource, Bookmark } from '@/modules/core/services/bookmarkService';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { theme } = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'lessons';

  // Feature toggles
  const showArticles = useFeatureEnabled('showArticles');

  // Lessons state
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [lessonSearch, setLessonSearch] = useState('');

  // Articles state
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategory, setArticleCategory] = useState<ArticleCategory | 'ALL'>('ALL');
  const [articlePage, setArticlePage] = useState(1);
  const [articleTotalPages, setArticleTotalPages] = useState(1);

  // Stats state
  const [progress, setProgress] = useState<{ totalCompleted: number; percentComplete: number } | null>(null);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingLessons(true);
        const [lessonsData, progressData, bookmarksData] = await Promise.all([
          getLessons(),
          getStudentProgress().catch(() => null),
          getBookmarks().catch(() => ({ bookmarks: [] }))
        ]);
        setAllLessons(lessonsData);
        setProgress(progressData);
        setBookmarks(bookmarksData.bookmarks);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoadingLessons(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoadingArticles(true);
        const filters: ArticleFilters = {
          page: articlePage,
          limit: 9,
          category: articleCategory !== 'ALL' ? articleCategory : undefined,
          search: articleSearch.trim() || undefined
        };

        const response = await getArticles(filters);
        setArticles(response?.articles ?? []);
        setArticleTotalPages(response?.pagination?.totalPages ?? 1);
      } catch (err) {
        console.error('Failed to fetch articles:', err);
      } finally {
        setLoadingArticles(false);
      }
    }

    const timer = setTimeout(fetchArticles, 300);
    return () => clearTimeout(timer);
  }, [articleSearch, articleCategory, articlePage]);

  async function handleRemoveBookmark(resourceType: string, resourceId: string) {
    try {
      await deleteBookmarkByResource(resourceType, resourceId);
      setBookmarks(prev => prev.filter(b => !(b.resourceType === resourceType && b.resourceId === resourceId)));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  }

  const filteredLessons = useMemo(() => {
    if (!lessonSearch) return allLessons;
    const s = lessonSearch.toLowerCase();
    return allLessons.filter(l => 
      l.title.toLowerCase().includes(s) || 
      l.description?.toLowerCase().includes(s)
    );
  }, [allLessons, lessonSearch]);

  const categories: (ArticleCategory | 'ALL')[] = [
    'ALL', 'MATH', 'SCIENCE', 'LITERATURE', 'HISTORY',
    'COMPUTER_SCIENCE', 'ARTS', 'LANGUAGES', 'GENERAL'
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-sky-400/5 rounded-full blur-3xl" />
      </div>

      <header className="border-b aero-panel sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Student Dashboard</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link to="/">
                <Button variant="ghost" size="sm">Home</Button>
              </Link>
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
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Learning Progress Summary */}
        {progress && (
          <Card className="mb-8 aero-glass border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Your Learning Progress</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={progress.percentComplete} className="h-2" />
                    </div>
                    <span className="text-sm font-medium">{progress.percentComplete}%</span>
                  </div>
                </div>
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Completions</p>
                    <p className="text-2xl font-bold">{progress.totalCompleted}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 aero-glass p-1 max-w-3xl">
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="classrooms" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Classrooms
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex items-center gap-2">
              <BookmarkIcon className="h-4 w-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Collections</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Explore Lessons</h2>
                <p className="text-muted-foreground">Master subjects through interactive lessons</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lessons..."
                  value={lessonSearch}
                  onChange={(e) => setLessonSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loadingLessons ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLessons.length === 0 ? (
              <Card className="p-12 text-center bg-muted/30">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No lessons found</h3>
                <p className="text-muted-foreground">Try a different search term</p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredLessons.map((lesson) => (
                  <Card key={lesson.id} className="aero-glass group hover:shadow-lg transition-all">
                    <CardHeader>
                      <Badge variant="outline" className="w-fit mb-2">Lesson</Badge>
                      <CardTitle className="group-hover:text-primary transition-colors line-clamp-1">{lesson.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{lesson.description || 'Interactive educational content.'}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/lessons/${lesson.id}`}>Start Learning</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="articles" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-1">Knowledge Hub</h2>
                <p className="text-muted-foreground">Deep dives and educational articles</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={articleCategory} onValueChange={v => setArticleCategory(v as any)}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'ALL' ? 'All Categories' : categoryLabels[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingArticles ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : articles.length === 0 ? (
              <Card className="p-12 text-center bg-muted/30">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No articles found</h3>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Card key={article.id} className="aero-glass flex flex-col">
                    <CardHeader className="flex-1">
                      <Badge className={categoryColors[article.category]}>{categoryLabels[article.category]}</Badge>
                      <CardTitle className="mt-3 line-clamp-1">{article.title}</CardTitle>
                      <CardDescription className="line-clamp-3">{article.excerpt}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/articles/${article.id}`}>Read Full Article</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-1">Saved for Later</h2>
            {bookmarks.length === 0 ? (
              <Card className="p-12 text-center bg-muted/30 border-dashed">
                <BookmarkIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">You haven't saved any content yet.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {bookmarks.map((bookmark) => (
                  <Card key={bookmark.id} className="aero-glass border-none shadow-sm hover:translate-x-1 transition-transform">
                    <CardContent className="py-4 flex items-center justify-between">
                      <Link 
                        to={bookmark.resourceType === 'LESSON' ? `/lessons/${bookmark.resourceId}` : `/articles/${bookmark.resourceId}`}
                        className="flex-1 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-muted">
                            {bookmark.resourceType === 'LESSON' ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">{bookmark.title}</p>
                            <p className="text-xs text-muted-foreground">Saved on {new Date(bookmark.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive opacity-50 hover:opacity-100"
                        onClick={() => handleRemoveBookmark(bookmark.resourceType, bookmark.resourceId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <LessonCollections />
          </TabsContent>

          <TabsContent value="classrooms" className="space-y-4">
            <StudentClassrooms />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
