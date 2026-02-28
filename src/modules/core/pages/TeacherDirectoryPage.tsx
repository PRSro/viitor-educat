import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, MapPin, ExternalLink, Mail, BookOpen, Search, RefreshCw } from 'lucide-react';

interface PortalTeacher {
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

interface TeachersResponse {
  teachers: PortalTeacher[];
  source: string;
  count?: number;
  fetchedAt?: string;
}

const teacherCategories = [
  "Informatică",
  "Matematică",
  "Fizică",
  "Limba Română",
  "Limba Engleză",
  "Limba Franceză",
  "Limba Germană",
  "Chimie",
  "Biologie",
  "Istorie",
  "Geografie",
  "Educație Fizică",
  "Dirigenție",
  "Conducere",
  "Altele"
];

export default function TeacherDirectoryPage() {
  const [teachers, setTeachers] = useState<PortalTeacher[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/portal/teachers`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data: TeachersResponse = await response.json();
      console.log('Fetched teachers:', data.teachers.length, 'source:', data.source);
      console.log('Sample teacher:', data.teachers[0]);
      setTeachers(data.teachers);
      setSource(data.source);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      t.name.toLowerCase().includes(searchLower) ||
      t.subjects.some(s => s.toLowerCase().includes(searchLower)) ||
      t.category.toLowerCase().includes(searchLower);
    
    if (activeCategory === 'all') {
      return matchesSearch;
    }
    
    if (activeCategory === 'Altele') {
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
    const colors: Record<string, string> = {
      'Informatică': 'from-accent to-teal-500',
      'Matematică': 'from-blue-500 to-indigo-600',
      'Fizică': 'from-purple-500 to-pink-600',
      'Limba Română': 'from-red-500 to-orange-500',
      'Limba Engleză': 'from-green-500 to-emerald-600',
      'Limba Franceză': 'from-pink-500 to-rose-600',
      'Limba Germană': 'from-yellow-500 to-amber-600',
      'Chimie': 'from-cyan-500 to-sky-600',
      'Biologie': 'from-lime-500 to-green-600',
      'Istorie': 'from-amber-600 to-orange-700',
      'Geografie': 'from-teal-500 to-cyan-600',
      'Educație Fizică': 'from-indigo-500 to-purple-600',
      'Dirigenție': 'from-violet-500 to-fuchsia-600',
      'Altele': 'from-gray-500 to-slate-600',
    };
    return colors[category] || 'from-gray-500 to-slate-600';
  };

  return (
    <main className="min-h-screen">
      <Header />
      <section className="py-24 lg:py-32 container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-6 backdrop-blur-sm">
            <Users className="w-4 h-4" />
            Corp Profesoral
          </span>
          <h1 className="text-display-sm lg:text-display-md text-foreground mb-4">
            Profesorii <span className="text-gradient">Tudor Vianu</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Echipa noastră de cadre didactice dedicate formării generației viitoare de informaticieni.
          </p>
          {source && (
            <p className="text-xs text-muted-foreground mt-2">
              {source === 'live' || source === 'cache' || source === 'stale-cache' 
                ? `Date preluate de pe portal.lbi.ro (${source === 'live' ? 'actualizat' : source === 'cache' ? 'din cache' : 'din cache (expirat)'})`
                : `Sursa: ${source}`}
            </p>
          )}
        </div>

        {/* Search & Refresh */}
        <div className="flex gap-4 max-w-md mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Caută după nume, materie..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="aero-glass pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchTeachers}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('all')}
              className="shrink-0"
            >
              Toți
            </Button>
            {teacherCategories.map(cat => (
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
            <p>Se încarcă lista de profesori...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            Nu s-au găsit profesori.
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {filteredTeachers.length} profesor{filteredTeachers.length !== 1 ? 'i' : ''} găsi{filteredTeachers.length !== 1 ? 'ți' : 't'}i
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map(teacher => (
                <div key={teacher.id} className="aero-glass p-6 hover-lift soft-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getCategoryColor(teacher.category)} flex items-center justify-center text-white text-xl font-bold shrink-0 relative overflow-hidden`}>
                      {getInitials(teacher.name)}
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg mb-1">
                        {teacher.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {teacher.subjects.length > 0 ? (
                          <>
                            {teacher.subjects.slice(0, 2).map((subject, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
                                {subject}
                              </span>
                            ))}
                            {teacher.subjects.length > 2 && (
                              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                                +{teacher.subjects.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                            {teacher.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground border-t pt-3 mt-3">
                    {teacher.office && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{teacher.office}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 shrink-0" />
                      {teacher.email ? (
                        <a href={`mailto:${teacher.email}`} className="text-accent hover:underline">
                          {teacher.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Email indisponibil</span>
                      )}
                    </div>
                    {teacher.website && (
                      <a href={teacher.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-accent hover:underline">
                        <ExternalLink className="w-4 h-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-8">
              Date preluate de pe{' '}
              <a href="http://portal.lbi.ro/acasa/profesori/" 
                 target="_blank" rel="noopener noreferrer"
                 className="text-accent hover:underline">
                portal.lbi.ro
              </a>
            </p>
          </>
        )}
      </section>
      <Footer />
    </main>
  );
}
