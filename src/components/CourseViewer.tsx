import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  FileText, 
  Play, 
  CheckCircle2, 
  Lock, 
  Clock,
  Users,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { GlassCard, ParallaxBackground, FloatingElement } from './ParallaxLayout';
import { Course } from '@/services/courseService';
import { Lesson } from '@/services/lessonService';

interface CourseViewerProps {
  course: Course;
  lessons: Lesson[];
  isEnrolled?: boolean;
  isTeacher?: boolean;
  progress?: number;
  completedLessons?: number;
  onEnroll?: () => void;
  onViewLesson?: (lessonId: string) => void;
}

export function CourseViewer({ 
  course, 
  lessons = [],
  isEnrolled = false, 
  isTeacher = false,
  progress = 0,
  completedLessons = 0,
  onEnroll,
  onViewLesson 
}: CourseViewerProps) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <ParallaxBackground className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div 
                className={`transition-all duration-700 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {course.level}
                  </Badge>
                  {course.category && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {course.category}
                    </Badge>
                  )}
                  {course.published && (
                    <Badge className="text-sm px-3 py-1 bg-green-500">
                      Published
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {course.title}
                </h1>

                {course.description && (
                  <p className="text-xl text-muted-foreground mb-6">
                    {course.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{lessons.length} Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{course._count?.enrollments || 0} Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>Created {formatDate(course.createdAt)}</span>
                  </div>
                </div>

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {course.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* CTA */}
                {!isEnrolled && !isTeacher && onEnroll && (
                  <div className="mt-8">
                    <Button 
                      size="lg" 
                      onClick={onEnroll}
                      className="aero-button-accent text-lg px-8 py-6"
                    >
                      Enroll Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}

                {isTeacher && (
                  <div className="mt-8">
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => navigate('/teacher')}
                      className="text-lg px-8 py-6"
                    >
                      Manage Course
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ParallaxBackground>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress (if enrolled) */}
          {isEnrolled && (
            <GlassCard className="p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Your Progress</h3>
                <span className="text-2xl font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {completedLessons} of {lessons.length} lessons completed
              </p>
            </GlassCard>
          )}

          {/* Lessons List */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6" />
              Course Content
            </h2>

            {lessons.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No lessons available yet.</p>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson, index) => {
                  const isCompleted = isEnrolled && completedLessons && completedLessons > index;
                  const canAccess = isEnrolled || isTeacher || course.published;

                  return (
                    <GlassCard 
                      key={lesson.id}
                      className="p-4 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isCompleted 
                              ? 'bg-green-500 text-white' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : canAccess ? (
                            <Play className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {index + 1}.
                            </span>
                            <h3 className="font-medium truncate">{lesson.title}</h3>
                          </div>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>

                        {canAccess && onViewLesson && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onViewLesson(lesson.id)}
                          >
                            {isEnrolled ? 'Continue' : 'View'}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6">
              <BookOpen className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Self-Paced Learning</h3>
              <p className="text-sm text-muted-foreground">
                Learn at your own pace with lifetime access to course materials.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <FileText className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Course Materials</h3>
              <p className="text-sm text-muted-foreground">
                Access {lessons.length} lessons with comprehensive content.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <CheckCircle2 className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Certificate</h3>
              <p className="text-sm text-muted-foreground">
                Earn a certificate upon completing all lessons.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseViewer;
