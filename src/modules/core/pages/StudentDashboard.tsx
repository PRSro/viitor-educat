/**
 * Enhanced Student Dashboard
 * 
 * Features:
 * - Enrolled courses with progress tracking
 * - Browse all available courses
 * - Articles section with category filtering and search
 * - Responsive design with tabs navigation
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings, useFeatureEnabled } from '@/contexts/SettingsContext';
import { Link } from 'react-router-dom';
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
  Filter,
  Loader2,
  Users,
  Settings,
  Layers,
  Link as LinkIcon,
  Bookmark as BookmarkIcon,
  Trash2
} from 'lucide-react';
import {
  getCourses,
  enrollInCourse,
  Course,
} from '@/modules/courses/services/courseService';
import { getStudentCourses, getStudentProgress, CourseWithProgress } from '@/modules/core/services/studentService';
import { getAllTeachers, TeacherWithProfile } from '@/modules/core/services/authService';
import { useNavigate } from 'react-router-dom';
import {
  getArticles,
  ArticleListItem,
  ArticleCategory,
  ArticleFilters,
  categoryLabels,
  categoryColors
} from '@/modules/articles/services/articleService';
import { getBookmarks, deleteBookmarkByResource, Bookmark, BookmarkResponse } from '@/modules/core/services/bookmarkService';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { settings, theme, isSettingsLoaded } = useSettings();
  const navigate = useNavigate();

  // Feature toggles from settings
  const showArticles = useFeatureEnabled('showArticles');
  const showFlashcards = useFeatureEnabled('showFlashcards');
  const showResources = useFeatureEnabled('showResources');

  // Courses state
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithProgress[]>([]);
  const [studentProgress, setStudentProgress] = useState<{
    totalEnrolled: number;
    totalCompleted: number;
    totalInProgress: number;
    percentComplete: number;
  } | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  // Course search/filter state
  const [courseSearch, setCourseSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<string>('ALL');

  // Articles state
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategory, setArticleCategory] = useState<ArticleCategory | 'ALL'>('ALL');
  const [articlePage, setArticlePage] = useState(1);
  const [articleTotalPages, setArticleTotalPages] = useState(1);

  // Teachers state
  const [teacherList, setTeacherList] = useState<TeacherWithProfile[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Fetch bookmarks
  useEffect(() => {
    async function fetchBookmarks() {
      try {
        setLoadingBookmarks(true);
        const data = await getBookmarks();
        setBookmarks(data.bookmarks);
      } catch (err) {
        console.error('Failed to fetch bookmarks:', err);
      } finally {
        setLoadingBookmarks(false);
      }
    }
    fetchBookmarks();
  }, []);

  async function handleRemoveBookmark(resourceType: string, resourceId: string) {
    try {
      await deleteBookmarkByResource(resourceType, resourceId);
      setBookmarks(prev => prev.filter(b => !(b.resourceType === resourceType && b.resourceId === resourceId)));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  }

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoadingCourses(true);
        const [enrolled, progress, all] = await Promise.all([
          getStudentCourses(),
          getStudentProgress(),
          getCourses()
        ]);
        setEnrolledCourses(enrolled);
        setStudentProgress(progress);
        setAllCourses(all);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courses');
      } finally {
        setLoadingCourses(false);
      }
    }
    fetchCourses();
  }, []);

  // Fetch teachers
  useEffect(() => {
    async function fetchTeachers() {
      try {
        setLoadingTeachers(true);
        const data = await getAllTeachers();
        setTeacherList(data);
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
      } finally {
        setLoadingTeachers(false);
      }
    }
    fetchTeachers();
  }, []);

  // Fetch articles with debounced search
  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoadingArticles(true);
        const filters: ArticleFilters = {
          page: articlePage,
          limit: 9,
        };
        if (articleCategory !== 'ALL') {
          filters.category = articleCategory;
        }
        if (articleSearch.trim()) {
          filters.search = articleSearch.trim();
        }

        const response = await getArticles(filters);
        setArticles(response.articles);
        setArticleTotalPages(response.pagination.totalPages);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch articles');
      } finally {
        setLoadingArticles(false);
      }
    }

    const timer = setTimeout(() => {
      fetchArticles();
    }, 300);
    return () => clearTimeout(timer);
  }, [articleSearch, articleCategory, articlePage]);

  async function handleEnroll(courseId: string) {
    try {
      setEnrollingId(courseId);
      await enrollInCourse(courseId);
      // Refresh courses
      const [enrolled, progress, all] = await Promise.all([
        getStudentCourses(),
        getStudentProgress(),
        getCourses()
      ]);
      setEnrolledCourses(enrolled);
      setStudentProgress(progress);
      setAllCourses(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setEnrollingId(null);
    }
  }

  // Filter out already enrolled courses from browse list
  const enrolledCourseIds = useMemo(() =>
    new Set(enrolledCourses.map(e => e.course.id)),
    [enrolledCourses]
  );

  // Categorize enrolled courses
  const inProgressCourses = useMemo(() =>
    enrolledCourses.filter(e => e.progress > 0 && e.progress < 100),
    [enrolledCourses]
  );

  const completedCourses = useMemo(() =>
    enrolledCourses.filter(e => e.progress === 100),
    [enrolledCourses]
  );

  // Recommended courses - published courses not enrolled in (limit 3)
  const recommendedCourses = useMemo(() => {
    return allCourses
      .filter(c => c.published && !enrolledCourseIds.has(c.id))
      .slice(0, 3);
  }, [allCourses, enrolledCourseIds]);

  const availableCourses = useMemo(() => {
    let courses = allCourses.filter(c => !enrolledCourseIds.has(c.id));

    if (courseSearch.trim()) {
      const search = courseSearch.toLowerCase();
      courses = courses.filter(c =>
        c.title.toLowerCase().includes(search) ||
        c.description?.toLowerCase().includes(search)
      );
    }

    if (teacherFilter !== 'ALL') {
      courses = courses.filter(c => c.teacherId === teacherFilter);
    }

    return courses;
  }, [allCourses, enrolledCourseIds, courseSearch, teacherFilter]);

  // Get unique teachers for filter dropdown
  const teachers = useMemo(() => {
    const teacherMap = new Map<string, { id: string; email: string; name: string }>();
    allCourses.forEach(course => {
      if (!teacherMap.has(course.teacherId)) {
        teacherMap.set(course.teacherId, {
          id: course.teacherId,
          email: course.teacher.email,
          name: course.teacher.teacherProfile?.bio
            ? course.teacher.teacherProfile.bio.substring(0, 30) + '...'
            : course.teacher.email.split('@')[0]
        });
      }
    });
    return Array.from(teacherMap.values());
  }, [allCourses]);

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

      {/* Header */}
      <header className="border-b bg-card/30 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Student Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link to="/">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">Home</Button>
              </Link>
              <Link to="/teachers">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <Users className="h-4 w-4 mr-2" />
                  Teachers
                </Button>
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
              <Button variant="outline" size="sm" onClick={logout} className="hover:bg-destructive/10 hover:text-destructive">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive backdrop-blur-sm">
            {error}
          </div>
        )}

        <Tabs defaultValue="my-courses" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-7 aero-glass p-1">
            <TabsTrigger value="my-courses" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <BookOpen className="h-4 w-4" />
              My Courses
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <Search className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <Users className="h-4 w-4" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="study-hub" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <GraduationCap className="h-4 w-4" />
              Study Hub
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <BookmarkIcon className="h-4 w-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          {/* My Courses Tab */}
          <TabsContent value="my-courses" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">My Enrolled Courses</h2>
              <p className="text-muted-foreground">Track your learning progress</p>
            </div>

            {loadingCourses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : enrolledCourses.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">
                  Browse available courses and start learning!
                </p>
                <Button onClick={() => document.querySelector('[value="browse"]')?.dispatchEvent(new Event('click'))}>
                  Browse Courses
                </Button>
              </Card>
            ) : (
              <>
                {/* Continue Learning Section - In Progress */}
                {inProgressCourses.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Continue Learning
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {inProgressCourses.map((enrollment) => (
                        <CourseCard
                          key={enrollment.id}
                          course={enrollment.course}
                          progress={enrollment.progress}
                          enrolledAt={enrollment.enrolledAt}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Section - 100% */}
                {completedCourses.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Completed
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {completedCourses.map((enrollment) => (
                        <CourseCard
                          key={enrollment.id}
                          course={enrollment.course}
                          progress={enrollment.progress}
                          enrolledAt={enrollment.enrolledAt}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Section - Not Enrolled */}
                {recommendedCourses.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Recommended for You
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {recommendedCourses.map((course) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          onEnroll={() => handleEnroll(course.id)}
                          enrolling={enrollingId === course.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Browse Courses Tab */}
          <TabsContent value="browse" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Browse All Courses</h2>
              <p className="text-muted-foreground">Discover new learning opportunities</p>
            </div>

            {/* Course Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={teacherFilter}
                onValueChange={setTeacherFilter}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Teachers</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(courseSearch || teacherFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCourseSearch('');
                    setTeacherFilter('ALL');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {loadingCourses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availableCourses.length === 0 ? (
              <Card className="p-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {courseSearch || teacherFilter !== 'ALL' ? 'No courses found' : 'All caught up!'}
                </h3>
                <p className="text-muted-foreground">
                  {courseSearch || teacherFilter !== 'ALL'
                    ? 'Try adjusting your search or filters'
                    : "You're enrolled in all available courses."}
                </p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEnroll={() => handleEnroll(course.id)}
                    enrolling={enrollingId === course.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Educational Articles</h2>
              <p className="text-muted-foreground">Explore learning resources by category</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={articleSearch}
                  onChange={(e) => {
                    setArticleSearch(e.target.value);
                    setArticlePage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={articleCategory}
                onValueChange={(v) => {
                  setArticleCategory(v as ArticleCategory | 'ALL');
                  setArticlePage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'ALL' ? 'All Categories' : categoryLabels[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingArticles ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : articles.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No articles found</h3>
                <p className="text-muted-foreground">
                  {articleSearch || articleCategory !== 'ALL'
                    ? 'Try adjusting your search or filters'
                    : 'Check back later for new content'}
                </p>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                {/* Pagination */}
                {articleTotalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={articlePage === 1}
                      onClick={() => setArticlePage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Page {articlePage} of {articleTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={articlePage === articleTotalPages}
                      onClick={() => setArticlePage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Browse Teachers</h2>
                <p className="text-muted-foreground">Discover educators and their courses</p>
              </div>
            </div>

            {loadingTeachers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : teacherList.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No teachers found</h3>
                <p className="text-muted-foreground">
                  Check back later for available educators.
                </p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teacherList.map((teacher) => (
                  <Card key={teacher.id} className="aero-glass hover:shadow-aero-strong transition-all">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                          {teacher.teacherProfile?.pictureUrl ? (
                            <img
                              src={teacher.teacherProfile.pictureUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {teacher.teacherProfile?.bio
                              ? teacher.teacherProfile.bio.substring(0, 30) + (teacher.teacherProfile.bio.length > 30 ? '...' : '')
                              : teacher.email.split('@')[0]}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{teacher.email}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {teacher.courses && teacher.courses.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{teacher.courses.length} Course(s)</p>
                          {teacher.courses.slice(0, 2).map((course) => (
                            <Link
                              key={course.id}
                              to={`/courses/${course.slug}`}
                              className="block p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <p className="font-medium text-sm truncate">{course.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {course._count?.lessons || 0} lessons · {course._count?.enrollments || 0} students
                              </p>
                            </Link>
                          ))}
                          {teacher.courses.length > 2 && (
                            <Link to={`/teachers/${teacher.id}`} className="text-sm text-primary hover:underline">
                              +{teacher.courses.length - 2} more courses
                            </Link>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No published courses yet</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/teachers/${teacher.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Study Hub Tab */}
          <TabsContent value="study-hub" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Study Hub</h2>
              <p className="text-muted-foreground">Access all your learning resources in one place</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Link to="/student/study">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="p-3 w-fit rounded-lg bg-primary/10 mb-2">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>My Study Dashboard</CardTitle>
                    <CardDescription>
                      Overview of your courses, progress, and recent activity
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/student/articles">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="p-3 w-fit rounded-lg bg-purple-100 dark:bg-purple-900/30 mb-2">
                      <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle>Articles & News</CardTitle>
                    <CardDescription>
                      Browse educational articles and latest updates
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/student/resources">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="p-3 w-fit rounded-lg bg-green-100 dark:bg-green-900/30 mb-2">
                      <ExternalLink className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Learning Resources</CardTitle>
                    <CardDescription>
                      Videos, links, PDFs and documents from your teachers
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Link to="/student/flashcards">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="p-3 w-fit rounded-lg bg-orange-100 dark:bg-orange-900/30 mb-2">
                      <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle>Flashcards</CardTitle>
                    <CardDescription>
                      Study with interactive flashcards organized by course
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Card className="h-full">
                <CardHeader>
                  <div className="p-3 w-fit rounded-lg bg-blue-100 dark:bg-blue-900/30 mb-2">
                    <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>
                    Common actions and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/student">
                      <BookOpen className="h-4 w-4 mr-2" />
                      My Courses
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/teachers">
                      <Users className="h-4 w-4 mr-2" />
                      Browse Teachers
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/profile">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Saved Items</h2>
              <p className="text-muted-foreground">Your bookmarked lessons and articles</p>
            </div>

            {loadingBookmarks ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : bookmarks.length === 0 ? (
              <Card className="p-12 text-center">
                <BookmarkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No saved items</h3>
                <p className="text-muted-foreground mb-4">
                  Bookmark lessons and articles to access them quickly later
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${bookmark.resourceType === 'LESSON' ? 'bg-primary/10' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                            {bookmark.resourceType === 'LESSON' ? (
                              <BookOpen className="h-5 w-5 text-primary" />
                            ) : (
                              <FileText className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{bookmark.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {bookmark.resourceType === 'LESSON' ? 'Lesson' : 'Article'} • {new Date(bookmark.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {bookmark.url ? (
                            <Link to={bookmark.url}>
                              <Button variant="outline" size="sm">
                                Open
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="outline" size="sm" disabled>
                              Unavailable
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleRemoveBookmark(bookmark.resourceType, bookmark.resourceId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Setări</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="space-y-1">
                    <p className="font-medium">Tema Întunecată</p>
                    <p className="text-sm text-muted-foreground">
                      Activează modul întunecat pentru interfață
                    </p>
                  </div>
                  <Link to="/settings">
                    <Button variant="outline" className="aero-button">
                      Gestionează Setări
                    </Button>
                  </Link>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" onClick={logout} className="aero-button">
                    Deconectare
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Course Card Component
interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    level: string;
    category?: string;
    teacher: {
      id: string;
      email: string;
      teacherProfile?: {
        bio: string | null;
        pictureUrl: string | null;
      } | null;
    };
    _count?: {
      lessons: number;
      enrollments: number;
    };
    totalLessons?: number;
  };
  progress?: number;
  enrolledAt?: string;
  onEnroll?: () => void;
  enrolling?: boolean;
}

function CourseCard({ course, progress, enrolledAt, onEnroll, enrolling }: CourseCardProps) {
  const isEnrolled = progress !== undefined;
  const lessonCount = course._count?.lessons ?? course.totalLessons ?? 0;

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      {course.imageUrl && (
        <div className="aspect-video bg-muted overflow-hidden">
          <img
            src={course.imageUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
        </div>
        {course.description && (
          <CardDescription className="line-clamp-2">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="flex items-center gap-3 mb-3">
          {course.teacher.teacherProfile?.pictureUrl ? (
            <img
              src={course.teacher.teacherProfile.pictureUrl}
              alt={course.teacher.email}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          )}
          <Link
            to={`/teachers/${course.teacher.id}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {course.teacher.teacherProfile?.bio
              ? course.teacher.teacherProfile.bio.substring(0, 30) + '...'
              : course.teacher.email}
          </Link>
        </div>
        {lessonCount > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {lessonCount} lessons
            </span>
            {!isEnrolled && course._count && course._count.enrollments > 0 && (
              <span className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                {course._count.enrollments} enrolled
              </span>
            )}
          </div>
        )}
        {isEnrolled && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        {isEnrolled ? (
          <Link to={`/courses/${course.slug}`} className="w-full">
            <Button className="w-full">Continue Learning</Button>
          </Link>
        ) : (
          <Button
            className="w-full"
            onClick={onEnroll}
            disabled={enrolling}
          >
            {enrolling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enrolling...
              </>
            ) : (
              'Enroll Now'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Article Card Component
interface ArticleCardProps {
  article: ArticleListItem;
}

function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="secondary"
            className={categoryColors[article.category]}
          >
            {categoryLabels[article.category]}
          </Badge>
          {article.sourceUrl && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <CardTitle className="text-lg line-clamp-2 mt-2">
          {article.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        {article.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
          {article.author && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {article.author.email}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link to={`/articles/${article.slug}`} className="w-full">
          <Button variant="outline" className="w-full">
            Read Article
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
