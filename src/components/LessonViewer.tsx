import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from './ProgressBar';
import { CommentThread } from './CommentThread';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  BookOpen,
  FileText,
  PlayCircle,
  FileStack
} from 'lucide-react';

interface LessonViewerProps {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    order: number;
    teacher: {
      id: string;
      email: string;
      teacherProfile: {
        bio: string | null;
        pictureUrl: string | null;
      } | null;
    };
    course: {
      id: string;
      title: string;
      slug: string;
    } | null;
    externalResources: {
      id: string;
      type: string;
      url: string;
      title: string;
      description: string | null;
    }[];
    flashcards: {
      id: string;
      question: string;
      answer: string;
    }[];
  };
  isCompleted: boolean;
  completedAt: string | null;
  progress: number;
  completedLessonsCount: number;
  totalLessons: number;
  navigation: {
    nextLesson: { id: string; title: string; order: number } | null;
    previousLesson: { id: string; title: string; order: number } | null;
  };
  onMarkComplete: () => Promise<void>;
  isCompleting: boolean;
}

export function LessonViewer({
  lesson,
  isCompleted,
  completedAt,
  progress,
  completedLessonsCount,
  totalLessons,
  navigation,
  onMarkComplete,
  isCompleting,
}: LessonViewerProps) {
  const navigate = useNavigate();
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setCurrentCard(0);
    setIsFlipped(false);
  }, [lesson.id]);

  const handleNextLesson = () => {
    if (navigation.nextLesson) {
      navigate(`/lessons/${navigation.nextLesson.id}`);
    }
  };

  const handlePreviousLesson = () => {
    if (navigation.previousLesson) {
      navigate(`/lessons/${navigation.previousLesson.id}`);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'YOUTUBE':
        return <PlayCircle className="h-4 w-4" />;
      case 'PDF':
        return <FileText className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    setCurrentCard((prev) => (prev + 1) % lesson.flashcards.length);
    setIsFlipped(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {lesson.course && (
            <Link 
              to={`/courses/${lesson.course.slug}`}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-1"
            >
              <BookOpen className="h-3 w-3" />
              {lesson.course.title}
            </Link>
          )}
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-muted-foreground mt-1">{lesson.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          ) : (
            <Button 
              onClick={onMarkComplete} 
              disabled={isCompleting || isCompleted}
              className="gap-2"
            >
              {isCompleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Mark as Complete
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Course Progress</span>
            <span className="text-sm font-medium">
              {completedLessonsCount} / {totalLessons} lessons ({Math.round(progress)}%)
            </span>
          </div>
          <ProgressBar value={progress} />
        </CardContent>
      </Card>

      {/* Lesson Content */}
      <Card>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6">
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </CardContent>
      </Card>

      {/* External Resources */}
      {lesson.externalResources && lesson.externalResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lesson.externalResources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {getResourceIcon(resource.type)}
                <div className="flex-1">
                  <p className="font-medium">{resource.title}</p>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Flashcards */}
      {lesson.flashcards && lesson.flashcards.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileStack className="h-5 w-5" />
                Flashcards ({lesson.flashcards.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFlashcards(!showFlashcards)}
              >
                {showFlashcards ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          {showFlashcards && (
            <CardContent>
              <div 
                className="min-h-[200px] p-6 rounded-lg border bg-muted/50 cursor-pointer flex flex-col items-center justify-center"
                onClick={handleCardFlip}
              >
                <p className="text-lg text-center font-medium">
                  {isFlipped 
                    ? lesson.flashcards[currentCard].answer 
                    : lesson.flashcards[currentCard].question
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  {isFlipped ? 'Click to see question' : 'Click to see answer'}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  Card {currentCard + 1} of {lesson.flashcards.length}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleNextCard}
                  >
                    Next Card
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <CommentThread lessonId={lesson.id} />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {navigation.previousLesson ? (
          <Button variant="outline" onClick={handlePreviousLesson}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous: {navigation.previousLesson.title}
          </Button>
        ) : (
          <div />
        )}
        
        {navigation.nextLesson ? (
          <Button onClick={handleNextLesson}>
            Next: {navigation.nextLesson.title}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button asChild>
            <Link to={`/courses/${lesson.course?.slug}`}>
              Back to Course
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
