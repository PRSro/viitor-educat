import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from './ProgressBar';
import { BookmarkButton } from './BookmarkButton';
import { BookOpen, Users, Clock, ChevronRight, User } from 'lucide-react';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    level?: string;
    category?: string;
    _count?: {
      lessons: number;
      enrollments: number;
    };
    teacher?: {
      id: string;
      email: string;
      teacherProfile?: {
        bio: string | null;
        pictureUrl: string | null;
      } | null;
    };
  };
  progress?: number;
  onEnroll?: () => void;
  enrolling?: boolean;
  showProgress?: boolean;
}

export function CourseCard({
  course,
  progress,
  onEnroll,
  enrolling,
  showProgress = false
}: CourseCardProps) {
  const isEnrolled = progress !== undefined;

  const teacherName = course.teacher?.teacherProfile?.bio
    ? course.teacher.teacherProfile.bio.substring(0, 30)
    : course.teacher?.email?.split('@')[0] || 'Teacher';

  const levelColors: Record<string, string> = {
    BEGINNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    ADVANCED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    EXPERT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 group">
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
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
          <div className="flex items-center gap-1 shrink-0">
            <BookmarkButton 
              resourceId={course.id} 
              resourceType="LESSON" 
              title={course.title}
              size="sm"
            />
            {course.level && (
              <Badge variant="secondary" className={levelColors[course.level] || ''}>
                {course.level}
              </Badge>
            )}
          </div>
        </div>
        {course.description && (
          <CardDescription className="line-clamp-2">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="flex items-center gap-2 mb-3">
          {course.teacher?.teacherProfile?.pictureUrl ? (
            <img
              src={course.teacher.teacherProfile.pictureUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          )}
          <Link
            to={`/teachers/${course.teacher?.id}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {teacherName}
          </Link>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course._count?.lessons || 0} lessons
          </span>
          {!isEnrolled && (
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course._count?.enrollments || 0} students
            </span>
          )}
        </div>

        {showProgress && isEnrolled && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} size="sm" />
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        {isEnrolled ? (
          <Link to={`/courses/${course.slug}`} className="w-full">
            <Button className="w-full">
              Continue Learning
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        ) : (
          <Button
            className="w-full"
            onClick={onEnroll}
            disabled={enrolling}
          >
            {enrolling ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Enrolling...
              </>
            ) : (
              'Enroll Now'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
