import { getToken } from '@/modules/core/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'ngrok-skip-browser-warning': 'true',
  };
}

export async function getComments(lessonId: string, page: number = 1, limit: number = 20): Promise<CommentsResponse> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/comments?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch comments');
  }

  return data;
}

export async function addComment(lessonId: string, content: string, parentId?: string): Promise<Comment> {
  const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, parentId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to add comment');
  }

  return data.comment;
}

export async function editComment(commentId: string, content: string): Promise<Comment> {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to edit comment');
  }

  return data.comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete comment');
  }
}
