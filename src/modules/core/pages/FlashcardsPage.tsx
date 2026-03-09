/**
 * Flashcards Page
 * View and study flashcards organized by lesson
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
  FlashcardListItem,
  FlashcardDeck as FlashcardDeckType
} from '@/modules/core/services/flashcardService';
import {
  Layers,
  Loader2,
  BookOpen,
  Play,
  Eye
} from 'lucide-react';

export default function FlashcardsPage() {
  const { user } = useAuth();

  const [flashcards, setFlashcards] = useState<FlashcardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studyMode, setStudyMode] = useState(false);
  const [currentDeck, setCurrentDeck] = useState<FlashcardListItem[]>([]);

  useEffect(() => {
    fetchFlashcards();
  }, []);

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

  const handleStudyDeck = (cards: FlashcardListItem[]) => {
    setCurrentDeck(cards);
    setStudyMode(true);
  };

  if (studyMode && currentDeck.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button variant="ghost" onClick={() => setStudyMode(false)}>
              ← Înapoi la Flashcard-uri
            </Button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FlashcardDeck
            flashcards={currentDeck}
            title="Mod Studiu"
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
              <h1 className="text-2xl font-bold">Flashcard-uri</h1>
              <p className="text-muted-foreground">
                Studiază și repetă cu flashcard-uri interactive
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {flashcards.length} carduri în total
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Răsfoiește
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Toate Cardurile
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
                <h3 className="text-lg font-medium mb-2">Niciun flashcard disponibil</h3>
                <p className="text-muted-foreground">
                  Flashcard-urile vor apărea aici când profesorii le vor crea pentru lecții
                </p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {flashcards.slice(0, 12).map((flashcard) => (
                  <FlashcardItem key={flashcard.id} flashcard={flashcard} />
                ))}
              </div>
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
                <h3 className="text-lg font-medium mb-2">Niciun flashcard disponibil</h3>
                <p className="text-muted-foreground">
                  Flashcard-urile vor apărea aici când profesorii le vor crea
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
                    Studiază Toate ({flashcards.length})
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {flashcards.map((flashcard) => (
                    <FlashcardItem key={flashcard.id} flashcard={flashcard} />
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
