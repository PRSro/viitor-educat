import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Bookmark as BookmarkIcon, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/apiClient';

interface Bookmark {
  id: string;
  resourceType: 'LESSON' | 'ARTICLE';
  resourceId: string;
  title: string;
  url: string | null;
  createdAt: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'LESSON' | 'ARTICLE'>('ALL');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const response = await api.get<{ bookmarks: Bookmark[] }>('/bookmarks');
        setBookmarks(response.bookmarks);
      } catch (err) {
        console.error('Failed to fetch bookmarks:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = bookmarks.filter(b => filter === 'ALL' || b.resourceType === filter);

  return (
    <div className="min-h-screen py-24 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-6 backdrop-blur-sm">
            <BookmarkIcon className="w-4 h-4" />
            Personal
          </span>
          <h1 className="text-display-sm lg:text-display-md text-foreground mb-4">
            Articole și Lecții <span className="text-gradient">Salvate</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Accesează rapid materialele salvate pentru studiu
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {(['ALL', 'LESSON', 'ARTICLE'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'Toate' : f === 'LESSON' ? 'Lecții' : 'Articole'}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <BookmarkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nu ai salvat nimic încă</h3>
            <p className="text-muted-foreground mb-4">
              Apasă iconița 🔖 pe orice lecție sau articol pentru a-l salva.
            </p>
            <Button asChild>
              <Link to="/courses">Explorează Lecții</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((bookmark) => (
              <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        bookmark.resourceType === 'LESSON' 
                          ? 'bg-primary/10' 
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {bookmark.resourceType === 'LESSON' ? (
                          <BookOpen className="h-5 w-5 text-primary" />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium line-clamp-2">{bookmark.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {bookmark.resourceType === 'LESSON' ? 'Lecție' : 'Articol'} •{' '}
                          {new Date(bookmark.createdAt).toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(bookmark.id)}
                      disabled={deletingId === bookmark.id}
                    >
                      {deletingId === bookmark.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {bookmark.url ? (
                    <Link to={bookmark.url}>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Deschide
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full mt-3" disabled>
                      Indisponibil
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
