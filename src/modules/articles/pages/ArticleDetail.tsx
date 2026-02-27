/**
 * Article Detail Page
 * 
 * Displays full article content with SEO meta tags.
 * Safely renders HTML content with XSS protection.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SafeHtml } from '@/components/SafeHtml';
import { 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  User,
  Loader2,
  BookOpen
} from 'lucide-react';
import { 
  getArticleBySlug, 
  Article,
  categoryLabels,
  categoryColors
} from '@/modules/articles/services/articleService';

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (slug) {
      fetchArticle(slug);
    }
  }, [slug, isAuthenticated, navigate]);

  async function fetchArticle(articleSlug: string) {
    try {
      setLoading(true);
      const data = await getArticleBySlug(articleSlug);
      setArticle(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Article Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || "The article you're looking for doesn't exist."}
            </p>
            <Link to="/student">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metaDescription = article.excerpt || 
    article.content.replace(/<[^>]+>/g, '').slice(0, 155) + '...';

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{article.title} | Educational Platform</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="article:published_time" content={article.createdAt} />
        <meta property="article:modified_time" content={article.updatedAt} />
        <meta property="article:section" content={categoryLabels[article.category]} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link to="/student" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <article>
            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4">
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
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Source
                  </a>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-lg text-muted-foreground mb-6">
                  {article.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y py-4">
                {article.author && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{article.author.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <time dateTime={article.createdAt}>
                    {new Date(article.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <SafeHtml content={article.content} />
            </div>
          </article>

          {/* Footer Navigation */}
          <footer className="mt-12 pt-8 border-t">
            <div className="flex justify-between items-center">
              <Link to="/student">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Articles
                </Button>
              </Link>
              {article.sourceUrl && (
                <a 
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">
                    View Original Source
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              )}
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
