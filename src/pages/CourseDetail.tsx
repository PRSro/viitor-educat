/**
 * Course Detail Page
 * 
 * Displays course information and lessons list.
 * Students can view their progress and access lesson content.
 */

import { useState, useEffect } from 'react';
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
  Play
} from 'lucide-react';
import { 
  getCourseBySlug, 
  enrollInCourse,
  Course 
} from '@/services/courseService';

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<{ progress: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (slug) {
      fetchCourse(slug);
    }
  }, [slug, isAuthenticated, navigate]);

  async function fetchCourse(courseSlug: string) {
    try {
      setLoading(true);
      const data = await getCourseBySlug(courseSlug);
      setCourse(data.course);
      setEnrollment(data.enrollment);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch course');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    if (!course) return;
    
    try {
      setEnrolling(true);
      await enrollInCourse(course.id);
      // Refresh course data
      if (slug) {
        const data = await getCourseBySlug(slug);
        setCourse(data.course);
        setEnrollment(data.enrollment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  }

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
            <Link to="/student">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEnrolled = enrollment !== null;
  const lessonCount = course.lessons?.length || 0;

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{course.title} | Educational Platform</title>
        <meta name="description" content={course.description || `Learn ${course.title} with expert instruction`} />
        <meta property="og:title" content={course.title} />
        <meta property="og:description" content={course.description || `Learn ${course.title} with expert instruction`} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/student" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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
                
                <h1 className="text-3xl font-bold tracking-tight mb-4">
                  {course.title}
                </h1>
                
                {course.description && (
                  <p className="text-lg text-muted-foreground">
                    {course.description}
                  </p>
                )}
              </div>

              {/* Lessons List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Content
                  </CardTitle>
                  <CardDescription>
                    {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!course.lessons || course.lessons.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No lessons available yet.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {course.lessons.map((lesson, index) => (
                        <li key={lesson.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-0.5">
                              {isEnrolled ? (
                                // Show progress icons if enrolled
                                index < Math.floor((enrollment?.progress || 0) / 100 * lessonCount) ? (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )
                              ) : (
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium">{lesson.title}</h4>
                              {lesson.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                            {isEnrolled && (
                              <Button variant="ghost" size="sm">
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
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
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Instructor</p>
                      <Link 
                        to={`/teachers/${course.teacher.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {course.teacher.teacherProfile?.bio 
                          ? course.teacher.teacherProfile.bio.substring(0, 30) + '...'
                          : course.teacher.email.split('@')[0]}
                      </Link>
                    </div>
                  </div>

                  {/* Teacher Profile Link */}
                  <Button variant="outline" className="w-full mb-6" asChild>
                    <Link to={`/teachers/${course.teacher.id}`}>
                      <User className="h-4 w-4 mr-2" />
                      View Teacher Profile
                    </Link>
                  </Button>

                  {/* Course Stats */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{lessonCount} Lessons</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Progress or Enroll */}
                  {isEnrolled ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Your Progress</span>
                        <span className="font-medium">{Math.round(enrollment?.progress || 0)}%</span>
                      </div>
                      <Progress value={enrollment?.progress || 0} className="h-2" />
                      <Badge variant="secondary" className="w-full justify-center py-1">
                        Enrolled
                      </Badge>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        'Enroll Now - Free'
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
