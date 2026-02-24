/**
 * Articles Page
 * Browse all articles with filters by category, teacher, and recency
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArticleCard, ArticleCardSkeleton, ArticleEmptyState } from '@/components/ArticleCard';
import {
  getArticles,
  getLatestArticles,
  ArticleListItem,
  ArticleCategory,
  ArticleFilters,
  categoryLabels
} from '@/services/articleService';
import {
  FileText,
  Search,
  Filter,
  Loader2,
  Calendar,
  User,
  Tag
} from 'lucide-react';

export default function ArticlesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [latestArticles, setLatestArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState<ArticleCategory | 'ALL'>(
    (searchParams.get('category') as ArticleCategory) || 'ALL'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [showLatest, setShowLatest] = useState(false);

  const categories: (ArticleCategory | 'ALL')[] = [
    'ALL', 'MATH', 'SCIENCE', 'LITERATURE', 'HISTORY',
    'COMPUTER_SCIENCE', 'ARTS', 'LANGUAGES', 'GENERAL'
  ];


  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const filters: ArticleFilters = {
        page,
        limit: 12,
      };

      if (category !== 'ALL') {
        filters.category = category;
      }

      if (search.trim()) {
        filters.search = search.trim();
      }

      const response = await getArticles(filters);
      setArticles(response.articles);
      setTotalPages(response.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, [category, page, search]);

  const fetchLatestArticles = useCallback(async () => {
    try {
      setLoadingLatest(true);
      const latest = await getLatestArticles();
      setLatestArticles(latest);
    } catch (err) {
      console.error('Failed to fetch latest articles:', err);
    } finally {
      setLoadingLatest(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    fetchLatestArticles();
  }, [fetchLatestArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value as ArticleCategory | 'ALL');
    setPage(1);
    searchParams.set('category', value === 'ALL' ? '' : value);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Articles & News</h1>
              <p className="text-muted-foreground">Browse educational articles and updates</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showLatest ? "default" : "outline"}
                onClick={() => setShowLatest(!showLatest)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Latest News
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Latest Articles Feed */}
        {showLatest && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Latest News & Updates
            </h2>
            {loadingLatest ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <ArticleCardSkeleton key={i} />
                ))}
              </div>
            ) : latestArticles.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestArticles.slice(0, 6).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No latest articles available</p>
              </Card>
            )}
          </section>
        )}

        {/* Filters */}
        <section className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'ALL' ? 'All Categories' : categoryLabels[cat as ArticleCategory]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </section>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Articles Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {category === 'ALL' ? 'All Articles' : categoryLabels[category as ArticleCategory]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {articles.length} article{articles.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <ArticleEmptyState
              title="No articles found"
              description={search || category !== 'ALL'
                ? "Try adjusting your search or filters"
                : "Check back later for new content"}
            />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => {
                      setPage(p => p - 1);
                      searchParams.set('page', String(page - 1));
                      setSearchParams(searchParams);
                    }}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => {
                      setPage(p => p + 1);
                      searchParams.set('page', String(page + 1));
                      setSearchParams(searchParams);
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
