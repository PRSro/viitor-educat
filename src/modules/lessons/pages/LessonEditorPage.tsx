import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LessonEditor } from '@/components/LessonEditor';
import { 
  getLesson, createLesson, updateLesson, deleteLesson,
  CreateLessonData, UpdateLessonData,
} from '@/modules/lessons/services/lessonService';
import { useAuth } from '@/contexts/AuthContext';
import { PageBackground } from '@/components/PageBackground';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LessonEditorPage() {
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const isNew = !lessonId;

  const { data: lessonData, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId!),
    enabled: !!lessonId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CreateLessonData | UpdateLessonData) => {
      if (lessonId) return updateLesson(lessonId, data as UpdateLessonData);
      return createLesson(data as CreateLessonData);
    },
    onSuccess: (savedLesson) => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      toast({ title: isNew ? 'Lesson created!' : 'Lesson saved!' });
      if (savedLesson?.id) navigate(`/lessons/${savedLesson.id}`);
    },
    onError: () => {
      toast({ title: 'Save failed', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLesson(lessonId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      toast({ title: 'Lesson deleted' });
      navigate('/teacher');
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      if (!lessonId) return;
      await updateLesson(lessonId, { status: publish ? 'PUBLIC' : 'DRAFT' } as any);
    },
    onSuccess: (_, publish) => {
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
      toast({ title: publish ? 'Lesson published!' : 'Lesson unpublished' });
    },
  });

  if (lessonId && isLoading) {
    return (
      <PageBackground>
        <div className="container mx-auto py-8 space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/teacher')} className="aero-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gradient">
              {isNew ? 'Create New Lesson' : 'Edit Lesson'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isNew ? 'Build a new standalone lesson for your students' : `Editing: ${lessonData?.lesson?.title}`}
            </p>
          </div>
        </div>
        <LessonEditor
          lesson={lessonData?.lesson}
          onSave={saveMutation.mutateAsync}
          onDelete={lessonId ? deleteMutation.mutateAsync : undefined}
          onPublish={lessonId ? publishMutation.mutateAsync : undefined}
          onViewLesson={() => lessonId && navigate(`/lessons/${lessonId}`)}
          isLoading={saveMutation.isPending || deleteMutation.isPending || publishMutation.isPending}
        />
      </div>
    </PageBackground>
  );
}
