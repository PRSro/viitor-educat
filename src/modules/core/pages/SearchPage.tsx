/**
 * Search Page
 * 
 * Global search with filters for courses, teachers, and articles
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CourseCard } from '@/components/CourseCard';
import { TeacherCard } from '@/components/TeacherCard';
import { 
  Search as SearchIcon,
  GraduationCap,
  BookOpen,
  Users,
  Loader2,
  Filter,
  X,
  FileText,
  ExternalLink
} from 'lucide-react';
import { 
  search, 
  getSearchFilters,
  SearchResponse,
  SearchFiltersResponse,
  SearchResultCourse,
  SearchResultTeacher,
  SearchResultArticle
} from '@/services/searchService';
import { useFeatureEnabled } from '@/contexts/SettingsContext';

export default function SearchPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const showArticles = useFeatureEnabled('showArticles');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<string>('all');
  const [results, setResults] = useState<SearchResponse['results'] | null>(null);
  const [filters, setFilters] = useState<SearchFiltersResponse['filters'] | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('ALL');

  useEffect(() => {
    async function fetchFilters() {
      try {
        const data = await getSearchFilters();
        setFilters(data.filters);
      } catch (err) {
        console.warn('Failed to fetch search filters');
      }
    }
    fetchFilters();
  }, []);

  async function handleSearch() {
    if (!searchQuery.trim() && selectedCategory === 'ALL' && selectedLevel === 'ALL' && selectedTeacher === 'ALL') {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const filterParams: any = {};
      if (selectedCategory !== 'ALL') filterParams.category = selectedCategory;
      if (selectedLevel !== 'ALL') filterParams.level = selectedLevel;
      if (selectedTeacher !== 'ALL') filterParams.teacherId = selectedTeacher;
      
      const data = await search(
        searchQuery.trim() || undefined,
        Object.keys(filterParams).length > 0 ? filterParams : undefined,
        searchType === 'all' ? undefined : searchType
      );
      
      setResults(data.results);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSelectedCategory('ALL');
    setSelectedLevel('ALL');
    setSelectedTeacher('ALL');
    setSearchQuery('');
  }

  const hasActiveFilters = selectedCategory !== 'ALL' || selectedLevel !== 'ALL' || selectedTeacher !== 'ALL' || searchQuery.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <SearchIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Search</h1>
                <p className="text-sm text-muted-foreground">
                  Find courses, teachers, and articles
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/student')}>
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Box */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses, teachers, articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {filters?.categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                {filters?.levels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Teachers</SelectItem>
                {results?.teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.email.split('@')[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Results */}
        {hasSearched ? (
          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList>
              <TabsTrigger value="courses" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Courses ({results?.courses.length || 0})
              </TabsTrigger>
              <TabsTrigger value="teachers" className="gap-2">
                <Users className="h-4 w-4" />
                Teachers ({results?.teachers.length || 0})
              </TabsTrigger>
              {showArticles && (
                <TabsTrigger value="articles" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Articles ({results?.articles.length || 0})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="courses">
              {results?.courses.length === 0 ? (
                <Card className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No courses found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {results?.courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="teachers">
              {results?.teachers.length === 0 ? (
                <Card className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No teachers found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {results?.teachers.map((teacher) => (
                    <TeacherCard key={teacher.id} teacher={teacher} />
                  ))}
                </div>
              )}
            </TabsContent>

            {showArticles && (
              <TabsContent value="articles">
                {results?.articles.length === 0 ? (
                  <Card className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No articles found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filters</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {results?.articles.map((article) => (
                      <Card key={article.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                          {article.excerpt && (
                            <CardDescription>{article.excerpt}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{article.category}</Badge>
                            <Button variant="outline" asChild>
                              <Link to={`/articles/${article.slug}`}>
                                Read More
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <Card className="p-12 text-center">
            <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Search for courses and teachers</h3>
            <p className="text-muted-foreground">
              Use the search box above to find what you're looking for
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
