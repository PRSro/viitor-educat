import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Mail, ChevronRight } from 'lucide-react';

interface TeacherCardProps {
  teacher: {
    id: string;
    email: string;
    teacherProfile?: {
      bio: string | null;
      pictureUrl: string | null;
    } | null;
    courses?: {
      id: string;
      title: string;
      slug: string;
      _count?: {
        lessons: number;
        enrollments: number;
      };
    }[];
  };
  onViewProfile?: () => void;
}

export function TeacherCard({ teacher, onViewProfile }: TeacherCardProps) {
  const profile = teacher.teacherProfile;
  const courseCount = teacher.courses?.length || 0;
  const totalLessons = teacher.courses?.reduce((acc, c) => acc + (c._count?.lessons || 0), 0) || 0;
  const totalStudents = teacher.courses?.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0) || 0;

  const displayName = teacher.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

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
              {profile?.bio ? displayName : displayName}
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
            {totalLessons} lessons
          </span>
          <span className="flex items-center gap-1">
            {totalStudents} students
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          className="w-full group-hover:bg-primary/90" 
          onClick={onViewProfile}
          asChild
        >
          <Link to={`/teachers/${teacher.id}`}>
            View Profile
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
