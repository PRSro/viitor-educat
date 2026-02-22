import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap,
  User,
  BookOpen,
  FileText,
  ExternalLink,
  Loader2,
  Mail,
  Globe,
  Linkedin,
  Twitter,
  Clock,
  Users,
  ChevronLeft,
  Calendar,
  Eye,
  CheckCircle2,
  Lock,
  FileStack,
  AlertCircle,
  Newspaper
} from 'lucide-react';
import { getTeacherProfile, TeacherProfile as TeacherProfileType, User as UserType, TeacherCourses, getTeacherArticles, getTeacherLessons, TeacherLesson, TeacherLesson as TeacherLessonType } from '../../../services/authService';
import { ArticleListItem, categoryLabels, categoryColors } from '../../../services/articleService';

interface TeacherData {
  teacher: UserType;
  profile: TeacherProfileType | null;
  courses: TeacherCourses[];
  articles?: ArticleListItem[];
  lessons?: TeacherLessonType[];
}

export default function TeacherProfilePage() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    async function fetchTeacherData() {
      if (!teacherId) return;

      try {
        setLoading(true);
        const data = await getTeacherProfile(teacherId);

        let articles: ArticleListItem[] = [];
        let lessons: TeacherLessonType[] = [];

        try {
          const articlesResponse = await getTeacherArticles(teacherId);
          articles = articlesResponse;
        } catch (e) {
          console.warn('No articles found for teacher');
        }

        try {
          lessons = await getTeacherLessons(teacherId);
        } catch (e) {
          console.warn('No lessons found for teacher');
        }

        setTeacherData({ ...data as TeacherData, articles, lessons });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch teacher profile');
      } finally {
        setLoading(false);
      }
    }
    fetchTeacherData();
  }, [teacherId]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !teacherData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Teacher Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'The teacher profile could not be found.'}
            </p>
            <Button onClick={() => navigate('/teachers')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Teachers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { teacher, profile, courses, articles = [], lessons = [] } = teacherData;
  const totalLessons = courses.reduce((acc, c) => acc + (c._count?.lessons || 0), 0);
  const totalStudents = courses.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0);

  const displayName = teacher.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Teacher Profile</h1>
                <p className="text-sm text-muted-foreground">
                  View teacher and their content
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm">Home</Button>
              </Link>
              {user?.role === 'TEACHER' && (
                <Link to="/teacher">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
              )}
              {user?.role === 'STUDENT' && (
                <Link to="/student">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
              )}
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {isDark ? <ChevronLeft className="h-4 w-4 rotate-180" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Avatar className="h-32 w-32 mx-auto border-4 border-primary/20">
                    <AvatarImage src={profile?.pictureUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                      {teacher.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-2xl font-bold mt-4">
                    {displayName}
                  </h2>
                  <Badge variant="secondary" className="mt-2">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Teacher
                  </Badge>
                  <p className="text-muted-foreground flex items-center justify-center gap-1 mt-2">
                    <Mail className="h-4 w-4" />
                    {teacher.email}
                  </p>
                </div>

                {profile?.bio && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{courses.length}</p>
                    <p className="text-xs text-muted-foreground">Courses</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{articles.length}</p>
                    <p className="text-xs text-muted-foreground">Newspapers</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{lessons.length}</p>
                    <p className="text-xs text-muted-foreground">Lessons</p>
                  </div>
                </div>

                {(profile?.office || profile?.officeHours || profile?.website || profile?.linkedin || profile?.twitter) && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-semibold">Contact Information</h3>

                    {profile.office && (
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.office}</span>
                      </div>
                    )}

                    {profile.officeHours && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.officeHours}</span>
                      </div>
                    )}

                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {profile.linkedin && (
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {profile.twitter && (
                      <a
                        href={`https://twitter.com/${profile.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Twitter className="h-4 w-4" />
                        {profile.twitter}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => navigate('/teachers')}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    All Teachers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="courses" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="courses" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Courses ({courses.length})
                </TabsTrigger>
                <TabsTrigger value="articles" className="gap-2">
                  <Newspaper className="h-4 w-4" />
                  Newspapers ({articles.length})
                </TabsTrigger>
                <TabsTrigger value="lessons" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Lessons ({lessons.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="space-y-4">
                <h2 className="text-2xl font-bold">Published Courses</h2>

                {courses.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="max-w-sm mx-auto">
                      <div className="p-4 rounded-full bg-muted mx-auto w-fit mb-4">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No courses published yet</h3>
                      <p className="text-muted-foreground">
                        This teacher hasn't published any courses yet.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {courses.map(course => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="articles" className="space-y-4">
                <h2 className="text-2xl font-bold">Published Newspapers</h2>

                {articles.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="max-w-sm mx-auto">
                      <div className="p-4 rounded-full bg-muted mx-auto w-fit mb-4">
                        <Newspaper className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No articles published yet</h3>
                      <p className="text-muted-foreground">
                        This teacher hasn't published any articles yet.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {articles.map(article => (
                      <NewspaperCard key={article.id} article={article} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="lessons" className="space-y-4">
                <h2 className="text-2xl font-bold">Published Lessons</h2>

                {lessons.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="max-w-sm mx-auto">
                      <div className="p-4 rounded-full bg-muted mx-auto w-fit mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No lessons published yet</h3>
                      <p className="text-muted-foreground">
                        This teacher hasn't published any standalone lessons yet.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {lessons.map(lesson => (
                      <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

interface CourseCardProps {
  course: TeacherCourses;
}

function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {course.imageUrl ? (
        <div className="aspect-video bg-muted overflow-hidden">
          <img
            src={course.imageUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary/30" />
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
      <CardContent className="pb-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {course._count?.lessons || course.lessons?.length || 0} lessons
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {course._count?.enrollments || 0} students
          </span>
        </div>
        {course.lessons && course.lessons.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Lessons:</p>
            <ul className="text-sm space-y-1">
              {course.lessons.slice(0, 3).map((lesson, idx) => (
                <li key={lesson.id} className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{idx + 1}</span>
                  <span className="truncate">{lesson.title}</span>
                </li>
              ))}
              {course.lessons.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{course.lessons.length - 3} more lessons
                </li>
              )}
            </ul>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Calendar className="h-3 w-3" />
          {new Date(course.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full" asChild>
          <Link to={`/courses/${course.slug}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Course
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

interface NewspaperCardProps {
  article: ArticleListItem;
}

function NewspaperCard({ article }: NewspaperCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </CardTitle>
          <Badge className={categoryColors[article.category] || categoryColors.GENERAL}>
            {categoryLabels[article.category] || article.category}
          </Badge>
        </div>
        {article.excerpt && (
          <CardDescription className="line-clamp-2">
            {article.excerpt}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
          {article.author && (
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {article.author.email.split('@')[0]}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full" asChild>
          <Link to={`/articles/${article.slug}`}>
            <Eye className="h-4 w-4 mr-2" />
            Read Newspaper
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

interface LessonCardProps {
  lesson: TeacherLessonType;
}

function LessonCard({ lesson }: LessonCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {lesson.title}
          </CardTitle>
          {lesson.course && (
            <Badge variant="outline">
              <BookOpen className="h-3 w-3 mr-1" />
              {lesson.course.title}
            </Badge>
          )}
        </div>
        {lesson.description && (
          <CardDescription className="line-clamp-2">
            {lesson.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(lesson.createdAt).toLocaleDateString()}
          </span>
          {lesson.order > 0 && (
            <span className="flex items-center gap-1">
              <FileStack className="h-4 w-4" />
              Lesson {lesson.order}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {lesson.course ? (
          <Button className="w-full" asChild>
            <Link to={`/courses/${lesson.course.slug}`}>
              <Eye className="h-4 w-4 mr-2" />
              View in Course
            </Link>
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link to={`/lessons/${lesson.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Lesson
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
