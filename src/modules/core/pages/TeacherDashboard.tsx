import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Link } from 'react-router-dom';
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
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
} from '@/modules/lessons/services/lessonService';
import { getCourses, Course, createCourse, updateCourse, deleteCourse, getTeacherCourses, getCourseAnalytics, getCourseStudents, CourseAnalytics, CourseStudent } from '@/modules/courses/services/courseService';
import { getTeacherArticles, uploadArticleFile, uploadLessonMaterial, TeacherLesson } from '@/modules/core/services/authService';
import { ArticleListItem, ArticleCategory, createArticle, getArticles, categoryLabels } from '@/modules/articles/services/articleService';
import { 
  getLessonCompletionRates, 
  getWeeklyActiveStudents, 
  getQuizPerformance, 
  LessonCompletionResponse,
  WeeklyActiveResponse,
  QuizPerformanceResponse
} from '@/modules/core/services/analyticsService';
import { sanitizeInput, containsXssPatterns } from '@/lib/sanitize';
import { lessonSchema, getFirstError } from '@/lib/validation';
import { NotificationBell } from '@/components/NotificationBell';
import { 
  BookOpen, 
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
  Play,
  ChevronRight,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Wand2,
  ArrowLeft,
  ArrowRight,
  View,
  AlertCircle,
  Upload,
  File,
  FileStack,
  X,
  Settings,
  TrendingUp,
  BarChart3,
  Target,
  Activity
} from 'lucide-react';
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
  const { theme } = useSettings();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [courseBuilderStep, setCourseBuilderStep] = useState(1);
  const [courseBuilderData, setCourseBuilderData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    lessons: [] as Lesson[]
  });
  const [courseSaving, setCourseSaving] = useState(false);

  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    content: '',
    courseId: ''
  });
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonFile, setLessonFile] = useState<File | null>(null);

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
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Detailed Analytics state
  const [lessonCompletions, setLessonCompletions] = useState<LessonCompletionResponse | null>(null);
  const [weeklyActive, setWeeklyActive] = useState<WeeklyActiveResponse | null>(null);
  const [quizPerformance, setQuizPerformance] = useState<QuizPerformanceResponse | null>(null);
  const [loadingDetailedAnalytics, setLoadingDetailedAnalytics] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [lessonsData, coursesData, articlesData] = await Promise.all([
          getLessons(),
          getTeacherCourses(),
          user?.id ? getTeacherArticles(user.id).catch(() => []) : Promise.resolve([])
        ]);
        setLessons(lessonsData || []);
        setCourses(coursesData || []);
        setArticles(articlesData || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data. Please check if the backend is running.');
        setLessons([]);
        setCourses([]);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleCourseSubmit() {
    if (!courseBuilderData.title.trim()) return;
    
    try {
      setCourseSaving(true);
      setError(null);
      const newCourse = await createCourse({
        title: courseBuilderData.title,
        description: courseBuilderData.description || undefined,
        imageUrl: courseBuilderData.imageUrl || undefined
      });
      
      const [lessonsData, coursesData] = await Promise.all([
        getLessons(),
        getTeacherCourses()
      ]);
      setLessons(lessonsData || []);
      setCourses(coursesData || []);
      
      setCourseBuilderStep(1);
      setCourseBuilderData({ title: '', description: '', imageUrl: '', lessons: [] });
      setActiveTab('courses');
      setSuccess('Course created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to create course:', err);
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setCourseSaving(false);
    }
  }

  async function handleDeleteCourse(id: string) {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      setError(null);
      await deleteCourse(id);
      const data = await getTeacherCourses();
      setCourses(data || []);
      setSuccess('Course deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    }
  }

  async function handleTogglePublish(course: Course) {
    try {
      setError(null);
      await updateCourse(course.id, { published: !course.published });
      const data = await getTeacherCourses();
      setCourses(data || []);
      setSuccess(course.published ? 'Course unpublished' : 'Course published!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    }
  }

  async function handleDeleteLesson(id: string) {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await deleteLesson(id);
      const data = await getLessons();
      setLessons(data || []);
      setSuccess('Lesson deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson');
    }
  }

  function openLessonForm(lesson?: Lesson) {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonFormData({
        title: lesson.title,
        description: lesson.description || '',
        content: lesson.content,
        courseId: lesson.courseId || ''
      });
    } else {
      setEditingLesson(null);
      setLessonFormData({ title: '', description: '', content: '', courseId: '' });
    }
    setLessonFormOpen(true);
  }

  async function handleLessonSubmit() {
    const sanitizedTitle = sanitizeInput(lessonFormData.title, 200);
    const sanitizedDescription = sanitizeInput(lessonFormData.description, 500);
    const sanitizedContent = sanitizeInput(lessonFormData.content, 50000);

    if (containsXssPatterns(sanitizedTitle) || containsXssPatterns(sanitizedContent)) {
      setError('Input contains invalid characters');
      return;
    }

    const validationErr = getFirstError(lessonSchema, {
      title: sanitizedTitle,
      description: sanitizedDescription || undefined,
      content: sanitizedContent,
    });
    if (validationErr) {
      setError(validationErr);
      return;
    }

    try {
      setLessonSaving(true);
      setError(null);
      if (editingLesson) {
        await updateLesson(editingLesson.id, { 
          title: sanitizedTitle, 
          description: sanitizedDescription, 
          content: sanitizedContent 
        });
        setSuccess('Lesson updated successfully!');
      } else {
        await createLesson({ 
          title: sanitizedTitle, 
          description: sanitizedDescription, 
          content: sanitizedContent,
          courseId: lessonFormData.courseId || undefined
        });
        setSuccess('Lesson created successfully!');
      }
      
      const [lessonsData, coursesData] = await Promise.all([
        getLessons(),
        getTeacherCourses()
      ]);
      setLessons(lessonsData || []);
      setCourses(coursesData || []);
      
      setLessonFormOpen(false);
      setEditingLesson(null);
      setLessonFormData({ title: '', description: '', content: '', courseId: '' });
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lesson');
    } finally {
      setLessonSaving(false);
    }
  }

  const myLessons = lessons.filter(l => l.teacherId === user?.id);
  const publishedCourses = courses.filter(c => c.published);
  const draftCourses = courses.filter(c => !c.published);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: 'article' | 'lesson') {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (type === 'article') {
      if (!file.name.endsWith('.docx')) {
        setFileError('Articles must be uploaded as .docx files only');
        setArticleFormData(prev => ({ ...prev, file: null }));
        return;
      }
      setArticleFormData(prev => ({ ...prev, file }));
    } else {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
        setFileError('Lesson materials must be uploaded as .md (Markdown) files only');
        return;
      }
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

      const articlesData = user?.id ? await getTeacherArticles(user.id).catch(() => []) : [];
      setArticles(articlesData || []);

      setArticleFormOpen(false);
      setArticleFormData({ title: '', content: '', excerpt: '', category: 'GENERAL', file: null });
      setFileError(null);
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

  async function fetchCourseAnalytics(courseId: string) {
    if (!courseId) return;
    
    try {
      setLoadingAnalytics(true);
      const data = await getCourseAnalytics(courseId);
      setAnalytics(data);
      setSelectedCourseId(courseId);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function fetchCourseStudents(courseId: string) {
    if (!courseId) return;
    
    try {
      setLoadingStudents(true);
      const data = await getCourseStudents(courseId);
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoadingStudents(false);
    }
  }

  async function handleCourseSelect(courseId: string) {
    await Promise.all([
      fetchCourseAnalytics(courseId),
      fetchCourseStudents(courseId)
    ]);
  }

  async function fetchDetailedAnalytics() {
    try {
      setLoadingDetailedAnalytics(true);
      const [lessonsData, activeData, quizData] = await Promise.all([
        getLessonCompletionRates(1, 10),
        getWeeklyActiveStudents(8),
        getQuizPerformance(1, 10)
      ]);
      setLessonCompletions(lessonsData);
      setWeeklyActive(activeData);
      setQuizPerformance(quizData);
    } catch (err) {
      console.error('Failed to fetch detailed analytics:', err);
    } finally {
      setLoadingDetailedAnalytics(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'detailed-analytics') {
      fetchDetailedAnalytics();
    }
  }, [activeTab]);

  function openArticleForm() {
    setArticleFormData({ title: '', content: '', excerpt: '', category: 'GENERAL', file: null });
    setFileError(null);
    setArticleFormOpen(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Teacher Dashboard...</p>
        </div>
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

      {/* Header */}
      <header className="border-b bg-card/30 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Teacher Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user?.email} ({user?.role})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">Home</Button>
              </Link>
              {user?.id && (
                <Link to={`/teachers/${user.id}`}>
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    My Public Profile
                  </Button>
                </Link>
              )}
              <NotificationBell />
              <Link to="/profile">
                <Button variant="outline" size="sm" className="aero-button">
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="outline" size="sm" className="aero-button">
                  <Settings className="h-4 w-4 mr-2" />
                  Setări
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
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-7 aero-glass p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20">Overview</TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-primary/20">Courses</TabsTrigger>
            <TabsTrigger value="lessons" className="data-[state=active]:bg-primary/20">Lessons</TabsTrigger>
            <TabsTrigger value="articles" className="data-[state=active]:bg-primary/20">Articles</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20">Analytics</TabsTrigger>
            <TabsTrigger value="detailed-analytics" className="data-[state=active]:bg-primary/20">Details</TabsTrigger>
            <TabsTrigger value="builder" className="data-[state=active]:bg-primary/20">Builder</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Courses</p>
                      <p className="text-3xl font-bold">{courses.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Published</p>
                      <p className="text-3xl font-bold">{publishedCourses.length}</p>
                    </div>
                    <Eye className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Drafts</p>
                      <p className="text-3xl font-bold">{draftCourses.length}</p>
                    </div>
                    <Edit className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Lessons</p>
                      <p className="text-3xl font-bold">{myLessons.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Articles</p>
                      <p className="text-3xl font-bold">{articles.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No courses yet</p>
                  ) : (
                    <div className="space-y-2">
                      {courses.slice(0, 5).map(course => (
                        <div key={course.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="font-medium truncate">{course.title}</span>
                          <Badge variant={course.published ? "default" : "secondary"}>
                            {course.published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Lessons</CardTitle>
                </CardHeader>
                <CardContent>
                  {myLessons.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No lessons yet</p>
                  ) : (
                    <div className="space-y-2">
                      {myLessons.slice(0, 5).map(lesson => (
                        <div key={lesson.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="font-medium truncate">{lesson.title}</span>
                          <Button size="sm" variant="ghost" onClick={() => openLessonForm(lesson)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Courses</h2>
              <Button onClick={() => setActiveTab('builder')}>
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </div>

            {courses.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">Create your first course to get started.</p>
                <Button onClick={() => setActiveTab('builder')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map(course => (
                  <Card key={course.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      {course.description && (
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {course._count?.lessons || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course._count?.enrollments || 0}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button 
                        size="sm" 
                        variant={course.published ? "default" : "outline"}
                        onClick={() => handleTogglePublish(course)}
                        className="flex-1"
                      >
                        {course.published ? "Published" : "Publish"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteCourse(course.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Lessons</h2>
              <Button onClick={() => openLessonForm()}>
                <Plus className="h-4 w-4 mr-2" />
                New Lesson
              </Button>
            </div>

            {myLessons.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
                <p className="text-muted-foreground mb-4">Create your first lesson to get started.</p>
                <Button onClick={() => openLessonForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lesson
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myLessons.map(lesson => (
                  <Card key={lesson.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{lesson.title}</h3>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {lesson.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(lesson.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openLessonForm(lesson)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeleteLesson(lesson.id)}>
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

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Articles</h2>
              <Button onClick={openArticleForm}>
                <Plus className="h-4 w-4 mr-2" />
                Publish Article
              </Button>
            </div>

            {articles.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No articles published yet</h3>
                <p className="text-muted-foreground mb-4">
                  Publish your first article. Articles require a .docx file upload.
                </p>
                <Button onClick={openArticleForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Publish Article
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {articles.map(article => (
                  <Card key={article.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{article.title}</h3>
                          {article.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {article.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[article.category] || article.category}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {new Date(article.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeleteArticle(article.id)}>
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Course Analytics</h2>
              <p className="text-muted-foreground">View student progress and course performance</p>
            </div>

            {/* Course Selector */}
            <Card className="aero-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Select Course
                </CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={selectedCourseId}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                >
                  <option value="">Select a course...</option>
                  {publishedCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course._count?.enrollments || 0} students)
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {loadingAnalytics || loadingStudents ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : analytics ? (
              <>
                {/* Analytics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="aero-glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Students</p>
                          <p className="text-3xl font-bold">{analytics.enrollment.total}</p>
                        </div>
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="aero-glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-3xl font-bold">{analytics.enrollment.completed}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="aero-glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg. Progress</p>
                          <p className="text-3xl font-bold">{analytics.enrollment.averageProgress}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="aero-glass">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Completion Rate</p>
                          <p className="text-3xl font-bold">{analytics.enrollment.completionRate}%</p>
                        </div>
                        <Target className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Student List */}
                <Card className="aero-glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Enrolled Students ({students.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {students.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No students enrolled yet</p>
                    ) : (
                      <div className="space-y-3">
                        {students.map(student => (
                          <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                {student.avatarUrl ? (
                                  <img src={student.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <User className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{student.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{Math.round(student.progress)}%</p>
                              {student.completedAt && (
                                <p className="text-xs text-green-500">Completed</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a course</h3>
                <p className="text-muted-foreground">
                  Choose a course above to view student analytics
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Detailed Analytics Tab */}
          <TabsContent value="detailed-analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Detailed Analytics</h2>
              <p className="text-muted-foreground">Lesson completions, student activity, and quiz performance</p>
            </div>

            {loadingDetailedAnalytics ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Weekly Active Students Chart */}
                <Card className="aero-glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Weekly Active Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weeklyActive && weeklyActive.weeklyActive.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weeklyActive.weeklyActive}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="weekStart" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                            labelFormatter={(value) => `Week of ${new Date(value).toLocaleDateString('ro-RO')}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="activeStudents" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            dot={{ fill: '#8b5cf6' }}
                            name="Active Students"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No activity data available yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Lesson Completion Rates */}
                <Card className="aero-glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Lesson Completion Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lessonCompletions && lessonCompletions.lessons.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={lessonCompletions.lessons} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                          <YAxis 
                            type="category" 
                            dataKey="title" 
                            width={150} 
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                          />
                          <Bar dataKey="completions" fill="#22c55e" name="Completions" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No lesson completion data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Quiz Performance */}
                <Card className="aero-glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Quiz Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quizPerformance && quizPerformance.quizzes.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={quizPerformance.quizzes.filter(q => q.hasAttempts)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="title" 
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                          />
                          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                            formatter={(value: number) => [`${value}%`, 'Average Score']}
                          />
                          <Bar dataKey="averageScore" fill="#06b6d4" name="Average Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No quiz data available</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Builder</CardTitle>
                <CardDescription>Create a new course in 3 steps</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center gap-2">
                    {[
                      { step: 1, label: 'Basic Info' },
                      { step: 2, label: 'Add Lessons' },
                      { step: 3, label: 'Preview' }
                    ].map((s, i) => (
                      <div key={s.step} className="flex items-center">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all
                          ${courseBuilderStep >= s.step 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'}
                        `}>
                          {courseBuilderStep > s.step ? <CheckCircle2 className="h-5 w-5" /> : s.step}
                        </div>
                        <span className={`ml-2 text-sm ${courseBuilderStep >= s.step ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {s.label}
                        </span>
                        {i < 2 && (
                          <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 1: Basic Info */}
                {courseBuilderStep === 1 && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Course Title *</label>
                        <Input
                          value={courseBuilderData.title}
                          onChange={(e) => setCourseBuilderData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Introduction to Web Development"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <Textarea
                          value={courseBuilderData.description}
                          onChange={(e) => setCourseBuilderData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what students will learn..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Cover Image URL</label>
                        <Input
                          value={courseBuilderData.imageUrl}
                          onChange={(e) => setCourseBuilderData(prev => ({ ...prev, imageUrl: e.target.value }))}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setCourseBuilderStep(2)} 
                        disabled={!courseBuilderData.title.trim()}
                      >
                        Next: Preview
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Preview */}
                {courseBuilderStep === 2 && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Title</p>
                            <p className="font-medium text-lg">{courseBuilderData.title || 'Untitled Course'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p>{courseBuilderData.description || 'No description'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="flex justify-between gap-4">
                      <Button variant="outline" onClick={() => setCourseBuilderStep(1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          onClick={async () => {
                            await handleCourseSubmit();
                          }}
                          disabled={courseSaving}
                        >
                          {courseSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Create Course
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Lesson Form Dialog */}
      <Dialog open={lessonFormOpen} onOpenChange={setLessonFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
            </DialogTitle>
            <DialogDescription>
              {editingLesson 
                ? 'Update the lesson content below.' 
                : 'Fill in the details for your new lesson.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lesson Title *</label>
              <Input
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Getting Started with HTML"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                value={lessonFormData.description}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Course (Optional)</label>
              <select
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                value={lessonFormData.courseId}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, courseId: e.target.value }))}
              >
                <option value="">Standalone Lesson</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="lesson-file" className="block text-sm font-medium mb-2">
                Upload .md File (Optional)
              </Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  id="lesson-file"
                  type="file"
                  accept=".md,.markdown"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
                        setError('Only .md (Markdown) files are accepted');
                        return;
                      }
                      setLessonFile(file);
                      setLessonFormData(prev => ({ ...prev, content: `[Uploaded: ${file.name}]` }));
                    }
                  }}
                />
                <label htmlFor="lesson-file" className="cursor-pointer">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">
                    {lessonFile ? lessonFile.name : 'Click to upload .md file'}
                  </p>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content *</label>
              <Textarea
                value={lessonFormData.content}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Lesson content... (or upload .md file above)"
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonFormOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLessonSubmit} 
              disabled={lessonSaving || !lessonFormData.title.trim() || !lessonFormData.content.trim()}
            >
              {lessonSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingLesson ? (
                'Update Lesson'
              ) : (
                'Create Lesson'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Article Form Dialog */}
      <Dialog open={articleFormOpen} onOpenChange={setArticleFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publish New Article</DialogTitle>
            <DialogDescription>
              Upload a .docx file to create an article, or enter content manually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="article-file" className="block text-sm font-medium mb-2">
                Upload .docx File *
              </Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  id="article-file"
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'article')}
                />
                <label htmlFor="article-file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {articleFormData.file ? articleFormData.file.name : 'Click to upload .docx file'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only .docx files are accepted
                  </p>
                </label>
              </div>
              {fileError && (
                <p className="text-sm text-destructive mt-2">{fileError}</p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Article Title</Label>
              <Input
                value={articleFormData.title}
                onChange={(e) => setArticleFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Article title"
                disabled={!!articleFormData.file}
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Category</Label>
              <select
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                value={articleFormData.category}
                onChange={(e) => setArticleFormData(prev => ({ ...prev, category: e.target.value as ArticleCategory }))}
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Content</Label>
              <Textarea
                value={articleFormData.content}
                onChange={(e) => setArticleFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Article content... (leave empty if uploading file)"
                rows={8}
                disabled={!!articleFormData.file}
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Excerpt</Label>
              <Textarea
                value={articleFormData.excerpt}
                onChange={(e) => setArticleFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief excerpt for the article preview..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArticleFormOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleArticleSubmit} 
              disabled={articleSaving || (!articleFormData.file && !articleFormData.content.trim())}
            >
              {articleSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Publish Article
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
