import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  GraduationCap,
  Search,
  User,
  BookOpen,
  FileText,
  ExternalLink,
  Loader2,
  Mail,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { getAllTeachers, TeacherWithProfile } from '@/modules/core/services/authService';
import { PageBackground } from '@/components/PageBackground';

export default function TeachersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const teachersData = await getAllTeachers();
        setTeachers(teachersData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const searchLower = searchQuery.toLowerCase();
    const profile = teacher.teacherProfile;
    const matchesBio = profile?.bio?.toLowerCase().includes(searchLower);
    const matchesEmail = teacher?.email?.toLowerCase().includes(searchLower) || false;
    return matchesBio || matchesEmail;
  });

  return (
    <PageBackground>
      <header className="backdrop-blur-md bg-card/30 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Browse
                </h1>
                <p className="text-sm text-muted-foreground">
                  Discover educators and content
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm">Home</Button>
              </Link>
              <Link to="/student">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {isDark ? <ChevronRight className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Our Educators</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTeachers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="p-4 rounded-full bg-muted mx-auto w-fit mb-4">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No teachers found' : 'No teachers yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search query' : 'Check back later for new educators'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeachers.map(teacher => (
              <TeacherCard 
                key={teacher.id} 
                teacher={teacher} 
                onViewProfile={() => navigate(`/teachers/${teacher.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </PageBackground>
  );
}

const getTeacherDisplayName = (teacher: TeacherWithProfile) => {
  if (teacher.teacherProfile?.bio) {
    return teacher.teacherProfile.bio.substring(0, 30);
  }
  return teacher?.email?.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? 'Teacher';
};

interface TeacherCardProps {
  teacher: TeacherWithProfile;
  onViewProfile: () => void;
}

function TeacherCard({ teacher, onViewProfile }: TeacherCardProps) {
  const profile = teacher.teacherProfile;

  const username = teacher.email?.split('@')[0] || 'teacher';
  const displaySubject = profile?.office || 'Educator';
  const displayAffiliation = profile?.school?.name || 'Viitor Educat Platform';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={profile?.pictureUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {teacher?.email?.substring(0, 2).toUpperCase() ?? 'TE'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">
              {getTeacherDisplayName(teacher)}
            </CardTitle>
            <div className="flex flex-col gap-1 mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {displaySubject}
              </span>
              <span className="line-clamp-1 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {displayAffiliation}
              </span>
              <span className="flex items-center gap-1 font-mono text-xs mt-1 bg-muted w-max px-2 py-0.5 rounded-md">
                @{username}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {profile?.bio ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {profile.bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic line-clamp-2 mb-4">
            No biography provided.
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          className="w-full group-hover:bg-primary/90" 
          onClick={onViewProfile}
        >
          View Profile
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
