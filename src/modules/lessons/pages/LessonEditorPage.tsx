import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LessonEditor } from '@/components/LessonEditor';
import { 
  getLesson, 
  createLesson, 
  updateLesson, 
  deleteLesson, 
  CreateLessonData,
  UpdateLessonData,
  Lesson 
} from '@/services/lessonService';
import { useAuth } from '@/contexts/AuthContext';

export default function LessonEditorPage() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId!),
    enabled: !!lessonId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CreateLessonData | UpdateLessonData) => {
      if (lessonId) {
        return updateLesson(lessonId, data);
      } else if (courseId) {
        return createLesson({
          title: (data as CreateLessonData).title,
          content: (data as CreateLessonData).content,
          description: (data as CreateLessonData).description,
          courseId,
          order: (data as CreateLessonData).order || 0,
        });
      }
      throw new Error('Course ID is required');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
      if (!lessonId) {
        navigate(`/courses/${courseId}/lessons`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLesson(lessonId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      navigate(`/courses/${courseId}/lessons`);
    },
  });

  if (lessonId && isLoading) {
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
    <LessonEditor
      lesson={lesson}
      courseId={courseId!}
      onSave={saveMutation.mutateAsync}
      onDelete={lessonId ? deleteMutation.mutateAsync : undefined}
      onViewCourse={() => navigate(`/courses/${courseId}`)}
      isLoading={saveMutation.isPending || deleteMutation.isPending}
    />
  );
}
