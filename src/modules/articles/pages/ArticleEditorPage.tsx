import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArticleEditor } from '@/components/ArticleEditor';
import { getArticleBySlug, createArticle, updateArticle, deleteArticle, CreateArticleData, Article } from '@/services/articleService';
import { useAuth } from '@/contexts/AuthContext';

interface ArticleEditorPageProps {
  articleSlug?: string;
}

export default function ArticleEditorPage({ articleSlug }: ArticleEditorPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { slug } = useParams();

  const articleIdOrSlug = articleSlug || slug;

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleIdOrSlug],
    queryFn: () => getArticleBySlug(articleIdOrSlug!),
    enabled: !!articleIdOrSlug,
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
      queryClient.invalidateQueries({ queryKey: ['article', articleIdOrSlug] });
      if (!article) {
        navigate(`/articles/${data.slug}`);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteArticle(article!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate('/student/articles');
    },
  });

  if (articleIdOrSlug && isLoading) {
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
      onSave={saveMutation.mutateAsync}
      onDelete={article ? deleteMutation.mutateAsync : undefined}
      isLoading={saveMutation.isPending || deleteMutation.isPending}
    />
  );
}
