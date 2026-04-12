import { api } from '@/lib/apiClient';
import { API_PATHS } from '@/lib/apiPaths';

export interface CommentAuthor {
  id: string;
  email: string;
  isTeacher: boolean;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: CommentAuthor;
  lessonId: string;
  parentId: string | null;
  createdAt: string;
  editedAt: string;
  isDeleted: boolean;
  replies?: Comment[];
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getComments(lessonId: string, page: number = 1, limit: number = 20): Promise<CommentsResponse> {
  return api.get(`${API_PATHS.LESSON_COMMENTS(lessonId)}?page=${page}&limit=${limit}`);
}

export async function addComment(lessonId: string, content: string, parentId?: string): Promise<Comment> {
  const data = await api.post<{ comment: Comment }>(API_PATHS.LESSON_COMMENTS(lessonId), { content, parentId });
  return data.comment;
}

export async function editComment(commentId: string, content: string): Promise<Comment> {
  const data = await api.patch<{ comment: Comment }>(API_PATHS.COMMENT(commentId), { content });
  return data.comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(API_PATHS.COMMENT(commentId));
}
