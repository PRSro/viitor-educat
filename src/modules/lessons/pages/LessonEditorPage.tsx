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
} from '@/modules/lessons/services/lessonService';
import { useAuth } from '@/contexts/AuthContext';

export default function LessonEditorPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
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
      } else {
        return createLesson(data as CreateLessonData);
      }
    },
    onSuccess: (savedLesson) => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
      if (!lessonId) {
        navigate(`/lessons/${savedLesson.id}`);
      } else {
        navigate(`/teacher`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLesson(lessonId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      navigate(`/teacher`);
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
      lesson={lesson?.lesson}
      onSave={saveMutation.mutateAsync}
      onDelete={lessonId ? deleteMutation.mutateAsync : undefined}
      onViewLesson={() => lessonId && navigate(`/lessons/${lessonId}`)}
      isLoading={saveMutation.isPending || deleteMutation.isPending}
    />
  );
}
