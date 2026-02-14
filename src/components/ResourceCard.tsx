/**
 * ResourceCard Component
 * Reusable card for displaying external learning resources
 */

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ResourceListItem, 
  resourceTypeLabels, 
  resourceTypeColors 
} from '@/services/resourceService';
import { ExternalLink, FileText, Link as LinkIcon, Play, File } from 'lucide-react';

interface ResourceCardProps {
  resource: ResourceListItem;
  showCourse?: boolean;
  showLesson?: boolean;
}

const resourceTypeIcons = {
  YOUTUBE: Play,
  LINK: LinkIcon,
  PDF: FileText,
  DOCUMENT: File,
};

export function ResourceCard({ resource, showCourse = false, showLesson = false }: ResourceCardProps) {
  const Icon = resourceTypeIcons[resource.type];
  
  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge 
            variant="secondary" 
            className={resourceTypeColors[resource.type]}
          >
            <Icon className="h-3 w-3 mr-1" />
            {resourceTypeLabels[resource.type]}
          </Badge>
        </div>
        <CardHeader className="p-0 pt-2">
          <h3 className="text-lg font-semibold line-clamp-2">{resource.title}</h3>
        </CardHeader>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        {resource.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {resource.description}
          </p>
        )}
        
        {(showCourse || showLesson) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {showCourse && resource.course && (
              <Badge variant="outline" className="text-xs">
                {resource.course.title}
              </Badge>
            )}
            {showLesson && resource.lesson && (
              <Badge variant="outline" className="text-xs">
                {resource.lesson.title}
              </Badge>
            )}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mt-3 truncate">
          {resource.url}
        </p>
      </CardContent>
      <CardFooter className="pt-2">
        <a 
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Resource
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}

/**
 * Resource Card Skeleton for loading states
 */
export function ResourceCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="pt-2">
          <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-3 w-full bg-muted rounded animate-pulse mt-3" />
      </CardContent>
      <CardFooter className="pt-2">
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </CardFooter>
    </Card>
  );
}

/**
 * Empty state for resources
 */
export function ResourceEmptyState({ 
  title = "No resources found", 
  description = "Resources will appear here when added by teachers" 
}: { title?: string; description?: string }) {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-sm mx-auto">
        <div className="p-4 rounded-full bg-muted mx-auto w-fit mb-4">
          <LinkIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
