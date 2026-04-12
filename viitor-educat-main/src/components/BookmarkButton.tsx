import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bookmark, 
  BookmarkCheck,
  Loader2
} from 'lucide-react';
import { checkBookmark, toggleBookmark, CreateBookmarkData } from '@/modules/core/services/bookmarkService';

interface BookmarkButtonProps {
  resourceId: string;
  resourceType: 'LESSON' | 'ARTICLE';
  title: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BookmarkButton({ 
  resourceId, 
  resourceType, 
  title, 
  url,
  size = 'md',
  className = ''
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    checkBookmarkStatus();
  }, [resourceId, resourceType]);

  async function checkBookmarkStatus() {
    try {
      const result = await checkBookmark(resourceType, resourceId);
      setBookmarked(result.isBookmarked);
    } catch (error) {
      console.error('Failed to check bookmark status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    if (toggling) return;

    const previousState = bookmarked;
    setBookmarked(!previousState);
    setToggling(true);

    try {
      await toggleBookmark({
        resourceType,
        resourceId,
        title,
        url
      });
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      setBookmarked(previousState);
    } finally {
      setToggling(false);
    }
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (loading) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`${sizeClasses[size]} ${className}`}
        disabled
      >
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`${sizeClasses[size]} ${className} ${bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
      onClick={handleToggle}
      disabled={toggling}
      title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {toggling ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : bookmarked ? (
        <BookmarkCheck className={`${iconSizes[size]} fill-current`} />
      ) : (
        <Bookmark className={iconSizes[size]} />
      )}
    </Button>
  );
}
