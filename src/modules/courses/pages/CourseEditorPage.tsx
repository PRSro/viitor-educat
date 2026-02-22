import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseEditor } from '../../../components/CourseEditor';
import {
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseLessons,
  CreateCourseData,
  Course
} from '../services/courseService';
import { createLesson, deleteLesson, CreateLessonData, Lesson } from '../../lessons/services/lessonService';
import { useAuth } from '@/contexts/AuthContext';

interface CourseEditorPageProps {
  courseId?: string;
}

export default function CourseEditorPage({ courseId: propCourseId }: CourseEditorPageProps) {
  const navigate = useNavigate();
  const { courseId: paramCourseId } = useParams<{ courseId: string }>();
  const courseId = propCourseId || paramCourseId;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseById(courseId!),
    enabled: !!courseId,
    select: (data) => data.course,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => getCourseLessons(courseId!),
    enabled: !!courseId,
  });

  const courseMutations = useMutation({
    mutationFn: async (data: CreateCourseData & { published?: boolean }) => {
      if (courseId) {
        return updateCourse(courseId, data);
      } else {
        const { published, ...createData } = data;
        return createCourse(createData);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      if (!courseId) {
        navigate(`/courses/${data.slug}/edit`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCourse(courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      navigate('/teacher');
    },
  });

  const lessonMutation = useMutation({
    mutationFn: async (data: CreateLessonData) => {
      return createLesson(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
    },
  });

  if (courseId && (courseLoading || lessonsLoading)) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <CourseEditor
      course={course}
      lessons={lessons}
      onSaveCourse={courseMutations.mutateAsync}
      onDeleteCourse={courseId ? deleteMutation.mutateAsync : undefined}
      onCreateLesson={lessonMutation.mutateAsync}
      onDeleteLesson={deleteLessonMutation.mutateAsync}
      isLoading={courseMutations.isPending || deleteMutation.isPending}
    />
  );
}
