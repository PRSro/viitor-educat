/**
 * Resources Page
 * Central repository for external learning materials
 * Grouped by course and teacher
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResourceCard, ResourceCardSkeleton, ResourceEmptyState } from '@/components/ResourceCard';
import { 
  getResources, 
  getResourcesByCourse,
  ResourceListItem, 
  ResourceType,
  ResourceFilters,
  resourceTypeLabels 
} from '@/services/resourceService';
import { 
  Link as LinkIcon, 
  FileText, 
  Play, 
  File,
  Search,
  Filter,
  Loader2,
  Youtube,
  FolderOpen,
  Users
} from 'lucide-react';

const resourceTypeOptions: ResourceType[] = ['YOUTUBE', 'LINK', 'PDF', 'DOCUMENT'];

const resourceTypeIcons = {
  YOUTUBE: Youtube,
  LINK: LinkIcon,
  PDF: FileText,
  DOCUMENT: File,
};

export default function ResourcesPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'ALL'>('ALL');
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'course'>('type');

  useEffect(() => {
    fetchResources();
  }, [typeFilter]);

  async function fetchResources() {
    try {
      setLoading(true);
      const filters: ResourceFilters = {
        limit: 100,
      };
      
      if (typeFilter !== 'ALL') {
        filters.type = typeFilter;
      }
      
      const response = await getResources(filters);
      setResources(response.resources);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  }

  const groupedResources = () => {
    if (groupBy === 'none') return null;
    
    if (groupBy === 'type') {
      const grouped: Record<ResourceType, ResourceListItem[]> = {
        YOUTUBE: [],
        LINK: [],
        PDF: [],
        DOCUMENT: [],
      };
      
      resources.forEach(r => {
        grouped[r.type].push(r);
      });
      
      return grouped;
    }
    
    if (groupBy === 'course') {
      const grouped: Record<string, ResourceListItem[]> = {};
      
      resources.forEach(r => {
        const key = r.course?.title || 'Unassigned';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });
      
      return grouped;
    }
    
    return null;
  };

  const grouped = groupBy !== 'none' ? groupedResources() : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Learning Resources</h1>
              <p className="text-muted-foreground">
                Central repository for videos, links, and documents
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {resources.length} resources
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={typeFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('ALL')}
              >
                All
              </Button>
              {resourceTypeOptions.map((type) => {
                const Icon = resourceTypeIcons[type];
                return (
                  <Button
                    key={type}
                    variant={typeFilter === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter(type)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {resourceTypeLabels[type].split(' ')[0]}
                  </Button>
                );
              })}
            </div>
            
            <div className="ml-auto">
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
                <SelectTrigger className="w-40">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No grouping</SelectItem>
                  <SelectItem value="type">Group by type</SelectItem>
                  <SelectItem value="course">Group by course</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Resources Display */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ResourceCardSkeleton key={i} />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <ResourceEmptyState />
        ) : grouped ? (
          <div className="space-y-8">
            {Object.entries(grouped).map(([key, items]) => {
              if (items.length === 0) return null;
              
              const Icon = resourceTypeIcons[key as ResourceType] || FolderOpen;
              
              return (
                <section key={key}>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">
                      {groupBy === 'type' ? resourceTypeLabels[key as ResourceType] : key}
                    </h2>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((resource) => (
                      <ResourceCard 
                        key={resource.id} 
                        resource={resource}
                        showCourse={groupBy !== 'course'}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
