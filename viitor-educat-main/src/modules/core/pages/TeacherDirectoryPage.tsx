import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Clock, ExternalLink, Mail, BookOpen, Search, RefreshCw, Code2, Brain, Shield, Database } from 'lucide-react';

interface Instructor {
  id: string;
  name: string;
  subjects: string[];
  category: string;
  email?: string;
  phone?: string;
  office?: string;
  officeHours?: string;
  website?: string;
  bio?: string;
}

interface InstructorsResponse {
  instructors: Instructor[];
  source: string;
  count?: number;
  fetchedAt?: string;
}

const instructorCategories = [
  "Computer Science",
  "Mathematics",
  "Cybersecurity",
  "AI/ML",
  "Data Science",
  "Physics",
  "Technical Writing",
  "Other"
];

export default function TeacherDirectoryPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/portal/teachers`);
      const data: InstructorsResponse = await response.json();
      console.log('Fetched instructors:', data.instructors.length, 'source:', data.source);
      console.log('Sample instructor:', data.instructors[0]);
      setInstructors(data.instructors);
      setSource(data.source);
    } catch (error) {
      console.error('Failed to fetch instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructors = instructors.filter(t => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      t.name.toLowerCase().includes(searchLower) ||
      t.subjects.some(s => s.toLowerCase().includes(searchLower)) ||
      t.category.toLowerCase().includes(searchLower);
    
    if (activeCategory === 'all') {
      return matchesSearch;
    }
    
    if (activeCategory === 'Other') {
      return matchesSearch && (t.category === 'Profesor' || t.category === 'Conducere');
    }
    
    return matchesSearch && t.category === activeCategory;
  });

  const getInitials = (name: string) => {
    const parts = name.replace('Prof. ', '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getCategoryColor = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('informatic') || lower.includes('computer')) return 'from-accent to-teal-500';
    if (lower.includes('matematic') || lower.includes('math')) return 'from-blue-500 to-indigo-600';
    if (lower.includes('fizic') || lower.includes('physic')) return 'from-purple-500 to-pink-600';
    if (lower.includes('securit') || lower.includes('cyber')) return 'from-lime-500 to-green-600';
    if (lower.includes('inteligent') || lower.includes('ai') || lower.includes('machine')) return 'from-sky-500 to-cyan-600';
    if (lower.includes('date') || lower.includes('data')) return 'from-teal-500 to-cyan-600';
    return 'from-gray-500 to-slate-600';
  };

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('informatic') || lower.includes('computer')) return Code2;
    if (lower.includes('inteligent') || lower.includes('ai') || lower.includes('machine')) return Brain;
    if (lower.includes('securit') || lower.includes('cyber')) return Shield;
    if (lower.includes('date') || lower.includes('data')) return Database;
    return BookOpen;
  };

  return (
    <main className="min-h-screen">
      <section className="py-24 lg:py-32 container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-6 backdrop-blur-sm">
            <Users className="w-4 h-4" />
            Our Team
          </span>
          <h1 className="text-display-sm lg:text-display-md text-foreground mb-4">
            Obscuron <span className="text-gradient">Instructors</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Our dedicated team of instructors shaping the next generation of cybersecurity and tech professionals.
          </p>
          {source && (
            <p className="text-xs text-muted-foreground mt-2">
              {source === 'live' || source === 'cache' || source === 'stale-cache' 
                ? `Data fetched from ${source === 'live' ? 'live source' : source === 'cache' ? 'cache' : 'expired cache'}`
                : `Source: ${source}`}
            </p>
          )}
        </div>

        <div className="flex gap-4 max-w-md mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="aero-glass pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchInstructors}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('all')}
              className="shrink-0"
            >
              All
            </Button>
            {instructorCategories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="shrink-0"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading instructors...</p>
          </div>
        ) : filteredInstructors.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            No instructors found.
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {filteredInstructors.length} instructor{filteredInstructors.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInstructors.map(instructor => (
                <div key={instructor.id} className="aero-glass p-6 hover-lift soft-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getCategoryColor(instructor.category)} flex items-center justify-center text-white text-xl font-bold shrink-0 relative overflow-hidden`}>
                      {getInitials(instructor.name)}
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg mb-1">
                        {instructor.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {instructor.subjects.length > 0 ? (
                          <>
                            {instructor.subjects.slice(0, 2).map((subject, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs flex items-center gap-1">
                                {React.createElement(getCategoryIcon(instructor.category), { className: "w-3 h-3" })}
                                {subject}
                              </span>
                            ))}
                            {instructor.subjects.length > 2 && (
                              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                                +{instructor.subjects.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                            {instructor.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground border-t pt-3 mt-3">
                    {instructor.office && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{instructor.office}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 shrink-0" />
                      {instructor.email ? (
                        <a href={`mailto:${instructor.email}`} className="text-accent hover:underline">
                          {instructor.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Email unavailable</span>
                      )}
                    </div>
                    {instructor.website && (
                      <a href={instructor.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-accent hover:underline">
                        <ExternalLink className="w-4 h-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
