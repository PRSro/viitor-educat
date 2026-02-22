import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap,
  Search,
  User,
  BookOpen,
  FileText,
  ExternalLink,
  Loader2,
  Mail,
  Globe,
  Linkedin,
  Twitter,
  Clock,
  Users,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Eye
} from 'lucide-react';
import { getAllTeachers, TeacherWithProfile } from '@/services/authService';
import { getCourses, Course } from '@/services/courseService';

export default function TeachersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherWithProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [teachersData, coursesData] = await Promise.all([
          getAllTeachers(),
          getCourses()
        ]);
        setTeachers(teachersData);
        setCourses(coursesData);
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
    const matchesEmail = teacher.email.toLowerCase().includes(searchLower);
    const matchesCourse = teacher.courses?.some(c => 
      c.title.toLowerCase().includes(searchLower)
    );
    return matchesBio || matchesEmail || matchesCourse;
  });

  const filteredCourses = courses.filter(course => {
    const searchLower = searchQuery.toLowerCase();
    const matchesTitle = course.title.toLowerCase().includes(searchLower);
    const matchesDesc = course.description?.toLowerCase().includes(searchLower);
    const matchesTeacher = course.teacher.email.toLowerCase().includes(searchLower);
    return matchesTitle || matchesDesc || matchesTeacher;
  });

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getTeacherDisplayName = (teacher: TeacherWithProfile) => {
    if (teacher.teacherProfile?.bio) {
      return teacher.teacherProfile.bio.substring(0, 30);
    }
    return teacher.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
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
                  Discover courses and educators
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

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses and teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs - Courses first */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Courses ({filteredCourses.length})
            </TabsTrigger>
            <TabsTrigger value="teachers" className="gap-2">
              <User className="h-4 w-4" />
              Teachers ({filteredTeachers.length})
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-4">
            <h2 className="text-2xl font-bold">Available Courses</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="p-4 rounded-full bg-muted mx-auto w-fit mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {searchQuery ? 'No courses found' : 'No courses available yet'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search query' : 'Check back later for new courses'}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map(course => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onViewCourse={() => navigate(`/courses/${course.slug}`)}
                    onViewTeacher={() => navigate(`/teachers/${course.teacherId}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-4">
            <h2 className="text-2xl font-bold">Our Educators</h2>
            
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Course Card Component
interface CourseCardProps {
  course: Course;
  onViewCourse: () => void;
  onViewTeacher: () => void;
}

function CourseCard({ course, onViewCourse, onViewTeacher }: CourseCardProps) {
  const teacherName = course.teacher.teacherProfile?.bio 
    ? course.teacher.teacherProfile.bio.substring(0, 30)
    : course.teacher.email.split('@')[0];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {course.imageUrl ? (
        <div className="aspect-video bg-muted overflow-hidden">
          <img 
            src={course.imageUrl} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-primary/30" />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
        {course.description && (
          <CardDescription className="line-clamp-2">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="sm" className="h-auto p-1" onClick={onViewTeacher}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground hover:text-primary">
                {teacherName}
              </span>
            </div>
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {course._count?.lessons || 0} lessons
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {course._count?.enrollments || 0} students
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full" onClick={onViewCourse}>
          View Course
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// Teacher Card Component
interface TeacherCardProps {
  teacher: TeacherWithProfile;
  onViewProfile: () => void;
}

function TeacherCard({ teacher, onViewProfile }: TeacherCardProps) {
  const profile = teacher.teacherProfile;
  const courseCount = teacher.courses?.length || 0;
  const totalLessons = teacher.courses?.reduce((acc, c) => acc + (c._count?.lessons || 0), 0) || 0;
  const totalStudents = teacher.courses?.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0) || 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={profile?.pictureUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {teacher.email.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">
              {getTeacherDisplayName(teacher)}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Mail className="h-3 w-3" />
              {teacher.email}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {profile?.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {profile.bio}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {courseCount} courses
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {totalLessons} lessons
          </span>
        </div>
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
