/**
 * FlashcardDeck Component
 * Interactive flashcard component with flip animation and navigation
 */

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlashcardListItem } from '@/modules/core/services/flashcardService';
import { ChevronLeft, ChevronRight, RotateCcw, Layers, CheckCircle } from 'lucide-react';

interface FlashcardDeckProps {
  flashcards: FlashcardListItem[];
  title?: string;
  showCourse?: boolean;
  onComplete?: () => void;
}

export function FlashcardDeck({ flashcards, title, showCourse = false, onComplete }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedIds, setStudiedIds] = useState<Set<string>>(new Set());

  if (flashcards.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="p-4 rounded-full bg-muted mx-auto w-fit mb-4">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No flashcards available</h3>
          <p className="text-muted-foreground">Flashcards will appear here when added by teachers</p>
        </div>
      </Card>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;
  const isStudied = studiedIds.has(currentCard.id);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setStudiedIds(prev => new Set(prev).add(currentCard.id));
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            <p className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {flashcards.length}
              {isStudied && <CheckCircle className="h-4 w-4 inline ml-2 text-green-500" />}
            </p>
          </div>
          <Badge variant="outline">
            {studiedIds.size} / {flashcards.length} studied
          </Badge>
        </div>
        <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          className="relative min-h-[200px] cursor-pointer perspective-1000"
          onClick={handleFlip}
        >
          <div 
            className={`transition-transform duration-500 transform-style-preserve-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front of card */}
            <div 
              className="backface-hidden p-6 border rounded-lg bg-card"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="flex flex-col items-center justify-center min-h-[180px] text-center">
                <p className="text-lg font-medium">{currentCard.question}</p>
                <p className="text-sm text-muted-foreground mt-4">Click to reveal answer</p>
              </div>
            </div>
            
            {/* Back of card */}
            <div 
              className="backface-hidden p-6 border rounded-lg bg-muted/50 rotate-y-180"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="flex flex-col items-center justify-center min-h-[180px] text-center">
                <p className="text-lg">{currentCard.answer}</p>
              </div>
            </div>
          </div>
        </div>

        {showCourse && currentCard.course && (
          <div className="mt-4 flex justify-center">
            <Badge variant="secondary">{currentCard.course.title}</Badge>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        {currentIndex === flashcards.length - 1 ? (
          <Button onClick={onComplete}>
            Complete
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * Simple flashcard display (non-interactive)
 */
interface FlashcardItemProps {
  flashcard: FlashcardListItem;
  showCourse?: boolean;
}

export function FlashcardItem({ flashcard, showCourse = false }: FlashcardItemProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <p className="font-medium">{flashcard.question}</p>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-muted-foreground">{flashcard.answer}</p>
      </CardContent>
      {showCourse && flashcard.course && (
        <CardFooter>
          <Badge variant="outline" className="text-xs">
            {flashcard.course.title}
          </Badge>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Flashcard deck grouped by lesson
 */
interface FlashcardDeckGroupedProps {
  groupedByLesson: Record<string, FlashcardListItem[]>;
  onStudyDeck?: (cards: FlashcardListItem[]) => void;
}

export function FlashcardDeckGrouped({ groupedByLesson, onStudyDeck }: FlashcardDeckGroupedProps) {
  const lessons = Object.keys(groupedByLesson);
  
  if (lessons.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No flashcard decks</h3>
        <p className="text-muted-foreground">Flashcards will appear here when added by teachers</p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {lessons.map((lessonTitle) => (
        <Card key={lessonTitle}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">{lessonTitle}</h3>
              </div>
              <Badge variant="secondary">
                {groupedByLesson[lessonTitle].length} cards
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {onStudyDeck && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onStudyDeck(groupedByLesson[lessonTitle])}
              >
                Study This Deck
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
