import { getToken } from '@/modules/core/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type NotificationType = 
  | 'LESSON_COMPLETED'
  | 'COURSE_ENROLLED'
  | 'ARTICLE_PUBLISHED'
  | 'COMMENT_REPLY'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'COURSE_COMPLETED'
  | 'ANNOUNCEMENT';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
  link?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Acum';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min.`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} or${hours > 1 ? 'e' : ''}`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} zi${days > 1 ? 'le' : ''}`;
  } else {
    return date.toLocaleDateString('ro-RO');
  }
}

export async function getNotifications(page: number = 1, limit: number = 20): Promise<{ 
  notifications: Notification[]; 
  pagination: { page: number; limit: number; total: number; totalPages: number } 
}> {
  const response = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch notifications');
  }

  return data;
}

export async function getUnreadCount(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch unread count');
  }

  return data.count || 0;
}

export async function markAsRead(notificationId: string): Promise<Notification> {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to mark notification as read');
  }

  return data.notification || data;
}

export async function markAllAsRead(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to mark all notifications as read');
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete notification');
  }
}
