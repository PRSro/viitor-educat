/**
 * Lesson Viewer Page
 * 
 * Displays lesson content with markdown, video, external links.
 * Handles lesson completion and navigation.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, ArrowLeft, BookOpen, LogIn } from 'lucide-react';
import { LessonViewer } from '@/components/LessonViewer';
import { viewLesson, completeLesson, LessonViewResponse, LessonCompleteResponse } from '@/modules/lessons/services/lessonService';

export default function LessonViewerPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [lessonData, setLessonData] = useState<LessonViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (lessonId) {
      fetchLesson(lessonId);
    }
  }, [lessonId]);

  async function fetchLesson(id: string) {
    try {
      setLoading(true);
      const data = await viewLesson(id);
      setLessonData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkComplete() {
    if (!lessonId) return;
    
    try {
      setCompleting(true);
      await completeLesson(lessonId);
      // Refresh lesson data to get updated progress
      if (lessonId) {
        await fetchLesson(lessonId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark lesson as complete');
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !lessonData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Lesson Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || "You may not be enrolled in this course."}
            </p>
            <Button onClick={() => navigate('/student')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { lesson, isCompleted, completedAt, isAuthenticated: isLessonAuthenticated, navigation } = lessonData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <Link 
                to={`/courses/${lesson.course?.slug}`}
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3" />
                {lesson.course?.title || 'Course'}
              </Link>
              <h1 className="font-semibold truncate">Lesson {lesson.order}: {lesson.title}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Login Banner for unauthenticated users viewing public lessons */}
        {!isLessonAuthenticated && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Preview Mode</p>
                <p className="text-sm text-muted-foreground">Log in to track your progress and earn certificates</p>
              </div>
              <Button onClick={() => navigate('/login', { state: { from: `/lessons/${lessonId}` } })}>
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
            </CardContent>
          </Card>
        )}
        <LessonViewer
          lesson={lesson}
          isCompleted={isCompleted}
          completedAt={completedAt}
          progress={0}
          completedLessonsCount={0}
          totalLessons={0}
          navigation={navigation}
          onMarkComplete={handleMarkComplete}
          isCompleting={completing}
        />
      </main>
    </div>
  );
}
