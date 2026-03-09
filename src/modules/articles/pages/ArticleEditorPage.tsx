import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArticleEditor } from '@/components/ArticleEditor';
import { getArticle, createArticle, updateArticle, deleteArticle, CreateArticleData } from '@/modules/articles/services/articleService';
import { useAuth } from '@/contexts/AuthContext';

export default function ArticleEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { id } = useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => getArticle(id!),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CreateArticleData) => {
      if (article) {
        return updateArticle(article.id, data);
      } else {
        return createArticle(data);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      if (!article) {
        navigate(`/articles/${data.id}`);
      } else {
        navigate('/teacher');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteArticle(article!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate('/teacher');
    },
  });

  if (id && isLoading) {
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
    <ArticleEditor
      article={article}
      onSave={async (data) => { await saveMutation.mutateAsync(data); }}
      onDelete={article ? async () => { await deleteMutation.mutateAsync(); } : undefined}
      isLoading={saveMutation.isPending || deleteMutation.isPending}
    />
  );
}
