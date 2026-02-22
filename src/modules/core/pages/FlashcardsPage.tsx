/**
 * Flashcards Page
 * View and study flashcards organized by course and lesson
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlashcardDeck,
  FlashcardDeckGrouped,
  FlashcardItem
} from '@/components/FlashcardDeck';
import {
  getFlashcards,
  getFlashcardsByCourse,
  FlashcardListItem,
  FlashcardDeck as FlashcardDeckType,
  CreateFlashcardData
} from '../../../services/flashcardService';
import {
  getCourses,
  Course
} from '../../../services/courseService';
import {
  Layers,
  Loader2,
  BookOpen,
  Plus,
  Play,
  Eye
} from 'lucide-react';

export default function FlashcardsPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [flashcards, setFlashcards] = useState<FlashcardListItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseFlashcards, setCourseFlashcards] = useState<FlashcardDeckType | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDeck, setLoadingDeck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studyMode, setStudyMode] = useState(false);
  const [currentDeck, setCurrentDeck] = useState<FlashcardListItem[]>([]);

  useEffect(() => {
    fetchFlashcards();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseFlashcards(selectedCourseId);
    }
  }, [selectedCourseId]);

  async function fetchFlashcards() {
    try {
      setLoading(true);
      const response = await getFlashcards({ limit: 100 });
      setFlashcards(response.flashcards);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flashcards');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourses() {
    try {
      const response = await getCourses();
      setCourses(response);
      if (response.length > 0) {
        setSelectedCourseId(response[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  }

  async function fetchCourseFlashcards(courseId: string) {
    try {
      setLoadingDeck(true);
      const data = await getFlashcardsByCourse(courseId);
      setCourseFlashcards(data);
    } catch (err) {
      console.error('Failed to fetch course flashcards:', err);
    } finally {
      setLoadingDeck(false);
    }
  }

  const handleStudyDeck = (cards: FlashcardListItem[]) => {
    setCurrentDeck(cards);
    setStudyMode(true);
  };

  const handleStudyAll = () => {
    if (courseFlashcards?.flashcards) {
      setCurrentDeck(courseFlashcards.flashcards);
      setStudyMode(true);
    }
  };

  if (studyMode && currentDeck.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button variant="ghost" onClick={() => setStudyMode(false)}>
              ← Back to Flashcards
            </Button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FlashcardDeck
            flashcards={currentDeck}
            title="Study Mode"
            showCourse
            onComplete={() => setStudyMode(false)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Flashcards</h1>
              <p className="text-muted-foreground">
                Study and review with interactive flashcards
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {flashcards.length} cards total
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Study by Course
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              All Cards
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : flashcards.length === 0 ? (
              <Card className="p-12 text-center">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No flashcards available</h3>
                <p className="text-muted-foreground">
                  Flashcards will appear here when teachers create them for their courses
                </p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {flashcards.slice(0, 12).map((flashcard) => (
                  <FlashcardItem key={flashcard.id} flashcard={flashcard} showCourse />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Study by Course Tab */}
          <TabsContent value="study" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                className="flex h-10 w-full sm:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedCourseId || ''}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>

              {courseFlashcards && courseFlashcards.totalCount > 0 && (
                <Button onClick={handleStudyAll} className="sm:ml-auto">
                  <Play className="h-4 w-4 mr-2" />
                  Study All ({courseFlashcards.totalCount})
                </Button>
              )}
            </div>

            {loadingDeck ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedCourseId && courseFlashcards ? (
              courseFlashcards.totalCount === 0 ? (
                <Card className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No flashcards for this course</h3>
                  <p className="text-muted-foreground">
                    This course doesn't have any flashcards yet
                  </p>
                </Card>
              ) : (
                <FlashcardDeckGrouped
                  groupedByLesson={courseFlashcards.groupedByLesson}
                  onStudyDeck={handleStudyDeck}
                />
              )
            ) : (
              <Card className="p-12 text-center">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a course</h3>
                <p className="text-muted-foreground">
                  Choose a course from the dropdown to see its flashcard decks
                </p>
              </Card>
            )}
          </TabsContent>

          {/* All Cards Tab */}
          <TabsContent value="all" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : flashcards.length === 0 ? (
              <Card className="p-12 text-center">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No flashcards available</h3>
                <p className="text-muted-foreground">
                  Flashcards will appear here when teachers create them
                </p>
              </Card>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => {
                    setCurrentDeck(flashcards);
                    setStudyMode(true);
                  }}>
                    <Play className="h-4 w-4 mr-2" />
                    Study All ({flashcards.length})
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {flashcards.map((flashcard) => (
                    <FlashcardItem key={flashcard.id} flashcard={flashcard} showCourse />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
