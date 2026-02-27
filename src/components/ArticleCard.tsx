/**
 * ArticleCard Component
 * Reusable card for displaying article previews
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArticleListItem, categoryLabels, categoryColors } from '@/modules/articles/services/articleService';
import { Clock, User, ExternalLink, Tag } from 'lucide-react';

interface ArticleCardProps {
  article: ArticleListItem;
  showTags?: boolean;
}

export function ArticleCard({ article, showTags = true }: ArticleCardProps) {
  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge 
            variant="secondary" 
            className={categoryColors[article.category]}
          >
            {categoryLabels[article.category]}
          </Badge>
          {article.sourceUrl && (
            <a 
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <CardHeader className="p-0 pt-2">
          <Link 
            to={`/articles/${article.slug}`}
            className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2"
          >
            {article.title}
          </Link>
        </CardHeader>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        {article.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.excerpt}
          </p>
        )}
        {showTags && article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{article.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
          {article.author && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {article.author.email.split('@')[0]}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link to={`/articles/${article.slug}`} className="w-full">
          <Button variant="outline" className="w-full">
            Read Article
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

/**
 * Article Card Skeleton for loading states
 */
export function ArticleCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-4 bg-muted rounded animate-pulse" />
        </div>
        <div className="pt-2">
          <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-2 mt-3">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </CardFooter>
    </Card>
  );
}

/**
 * Empty state for articles
 */
export function ArticleEmptyState({ 
  title = "No articles found", 
  description = "Check back later for new content" 
}: { title?: string; description?: string }) {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-sm mx-auto">
        <div className="p-4 rounded-full bg-muted mx-auto w-fit mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
