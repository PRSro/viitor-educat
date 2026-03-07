/**
 * Course Detail Page
 * 
 * Displays course information, lessons list, and progress.
 * Students can view lessons and track progress.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  BookOpen,
  User,
  Clock,
  Loader2,
  CheckCircle,
  Circle,
  Play,
  ChevronRight,
  Lock,
  LogIn,
  Trophy,
  LayoutList
} from 'lucide-react';
import {
  getCourseBySlug,
  enrollInCourse,
  Course
} from '@/modules/courses/services/courseService';
import { getCourseProgress, resumeCourse, CourseProgress } from '@/modules/core/services/studentService';

interface CourseWithDetails {
  id: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  level?: string;
  category?: string;
  teacherId: string;
  teacher: {
    id: string;
    email: string;
    teacherProfile?: {
      bio: string | null;
      pictureUrl: string | null;
    } | null;
  };
  published: boolean;
  lessons?: {
    id: string;
    title: string;
    description?: string;
    order: number;
    slug?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseWithDetails | null>(null);
  const [enrollment, setEnrollment] = useState<{ progress: number } | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchCourse(slug);
    }
  }, [slug]);

  async function fetchCourse(courseSlug: string) {
    try {
      setLoading(true);
      const data = await getCourseBySlug(courseSlug);
      setCourse(data.course);
      setEnrollment(data.enrollment);

      // If enrolled and authenticated, fetch detailed progress
      if (data.enrollment && isAuthenticated) {
        try {
          const progressData = await getCourseProgress(data.course.id);
          setCourseProgress(progressData);
        } catch (e) {
          console.warn('Failed to fetch course progress');
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch course');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/courses/${slug}`);
      return;
    }
    if (!course) return;

    try {
      setEnrolling(true);
      await enrollInCourse(course.id);
      if (slug) {
        await fetchCourse(slug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  }

  async function handleContinue() {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/courses/${slug}`);
      return;
    }
    if (!course) return;

    try {
      const data = await resumeCourse(course.id);
      if (data.lesson) {
        navigate(`/lessons/${data.lesson.slug ?? data.lesson.id}`);
      } else if (course.lessons && course.lessons.length > 0) {
        // Fallback to first incomplete lesson
        const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);
        const completedSet = new Set(courseProgress?.lessons.filter(l => l.completed).map(l => l.id) || []);
        const firstIncomplete = sortedLessons.find(l => !completedSet.has(l.id));
        if (firstIncomplete) {
          navigate(`/lessons/${firstIncomplete.slug ?? firstIncomplete.id}`);
        } else {
          navigate(`/lessons/${sortedLessons[0].slug ?? sortedLessons[0].id}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume');
    }
  }

  const isEnrolled = enrollment !== null;
  
  // Sorted lessons
  const sortedLessons = useMemo(() => {
    if (!course?.lessons) return [];
    return [...course.lessons].sort((a, b) => a.order - b.order);
  }, [course?.lessons]);
  
  const lessonCount = sortedLessons.length;

  // Derived progress values
  const completedSet = useMemo(() => 
    new Set(courseProgress?.lessons.filter(l => l.completed).map(l => l.id) || []), 
    [courseProgress?.lessons]
  );
  
  const completedCount = courseProgress?.completedLessonsCount ?? 0;
  
  const progressPercent = courseProgress?.progress ?? Math.round(enrollment?.progress ?? 0);

  const levelColors: Record<string, string> = {
    BEGINNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    ADVANCED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    EXPERT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || "The course you're looking for doesn't exist."}
            </p>
            <Link to={isAuthenticated ? (user?.role === 'TEACHER' ? '/teacher' : '/student') : '/courses'}>
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isAuthenticated ? 'Back to Dashboard' : 'Browse Courses'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{course.title} | Educational Platform</title>
        <meta name="description" content={course.description || `Learn ${course.title} with expert instruction`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to={isAuthenticated ? (user?.role === 'TEACHER' ? '/teacher' : '/student') : '/courses'} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isAuthenticated ? 'Back to Dashboard' : 'Browse Courses'}
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <div>
                {course.imageUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-muted">
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  {course.level && (
                    <Badge variant="secondary" className={levelColors[course.level] || ''}>
                      {course.level}
                    </Badge>
                  )}
                  {course.category && (
                    <Badge variant="outline">
                      {course.category}
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl font-bold tracking-tight mb-4">
                  {course.title}
                </h1>

                {course.description && (
                  <p className="text-lg text-muted-foreground">
                    {course.description}
                  </p>
                )}
              </div>

              {/* Progress Card when enrolled */}
              {isEnrolled && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className={`h-5 w-5 ${progressPercent === 100 ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                        <span className="font-semibold">
                          {progressPercent === 100 ? 'Course Completed!' : 'Your Progress'}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {completedCount} / {lessonCount} · {progressPercent}%
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-3 mb-2" />
                    {progressPercent === 100 && (
                      <p className="text-sm text-center text-primary font-medium mt-2 flex items-center justify-center gap-2">
                        <Trophy className="h-4 w-4" /> Amazing work! You've mastered this course.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Lessons List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutList className="h-5 w-5" />
                    Course Content
                  </CardTitle>
                  <CardDescription>
                    {lessonCount} lesson{lessonCount !== 1 ? 's' : ''} total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lessonCount === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground italic">No lessons yet.</p>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {sortedLessons.map((lesson, index) => {
                        const isCompleted = completedSet.has(lesson.id);
                        const isAccessible = isEnrolled;

                        return (
                          <li key={lesson.id} className="py-5 first:pt-0 last:pb-0">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium mt-0.5">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
                                  ) : isAccessible ? (
                                    <Circle className="h-4 w-4 text-primary/40" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                                  )}
                                  <h4 className="font-semibold truncate">{lesson.title}</h4>
                                </div>
                                {lesson.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                              {(isAccessible && lesson.slug) && (
                                <Button
                                  variant={isCompleted ? "outline" : "default"}
                                  size="sm"
                                  className="flex-shrink-0"
                                  onClick={() => navigate(`/lessons/${lesson.slug}`)}
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                  ) : (
                                    <Play className="h-4 w-4 mr-2 fill-current" />
                                  )}
                                  {isCompleted ? "Review" : "Start"}
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardContent className="pt-6">
                  {/* Instructor */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {course.teacher.teacherProfile?.pictureUrl ? (
                        <img
                          src={course.teacher.teacherProfile.pictureUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Instructor</p>
                      <Link
                        to={`/teachers/${course.teacher.id}`}
                        className="font-medium hover:text-primary transition-colors block truncate"
                      >
                        {course.teacher.teacherProfile?.bio
                          ? (course.teacher.teacherProfile.bio.length > 30 ? course.teacher.teacherProfile.bio.substring(0, 30) + '...' : course.teacher.teacherProfile.bio)
                          : (course.teacher?.email?.split('@')[0] ?? 'Teacher')}
                      </Link>
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="space-y-3 mb-6 border-y py-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>Lessons</span>
                      </div>
                      <span className="font-medium">{lessonCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated</span>
                      </div>
                      <span className="font-medium">{new Date(course.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Progress or Enroll */}
                  {isEnrolled ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground font-medium">Completion</span>
                          <span className="font-bold">{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {completedCount} of {lessonCount} lessons completed
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleContinue}
                      >
                        {progressPercent === 0 ? "Start Learning" : "Continue Learning"}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>

                      <div className="flex justify-center">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none px-4 py-1">
                          Successfully Enrolled
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrolling || lessonCount === 0}
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enrolling...
                        </>
                      ) : !isAuthenticated ? (
                        <>
                          <LogIn className="h-4 w-4 mr-2" />
                          Log in to Enroll
                        </>
                      ) : (
                        <>
                          Enroll in Course
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
