/**
 * Notification Service
 * Handles API calls for user notifications
 */

import { api } from '@/lib/apiClient';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export interface BroadcastData {
  type: string;
  title: string;
  message: string;
  link?: string;
  lessonId?: string; // Changed courseId to lessonId
  userIds?: string[];
}

export async function getNotifications(options?: { 
  limit?: number; 
  offset?: number; 
  unread?: boolean 
}): Promise<NotificationResponse> {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.unread) params.append('unread', 'true');

  const queryString = params.toString();
  return api.get(`/notifications${queryString ? '?' + queryString : ''}`);
}

export async function getUnreadCount(): Promise<number> {
  try {
    const data = await api.get<{ unreadCount: number }>('/notifications/unread-count');
    return data.unreadCount;
  } catch {
    return 0;
  }
}

export async function createNotification(data: CreateNotificationData): Promise<Notification> {
  const result = await api.post<{ notification: Notification }>('/notifications', data);
  return result.notification;
}

export async function broadcastNotification(data: BroadcastData): Promise<{ created: number }> {
  return api.post('/notifications/broadcast', data);
}

export async function markAsRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`, {});
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all', {});
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}

export function getNotificationIcon(type: Notification['type']): string {
  switch (type) {
    case 'LESSON_UPDATE': // Changed COURSE_UPDATE to LESSON_UPDATE
      return 'book';
    case 'NEW_ARTICLE':
      return 'file-text';
    case 'NEW_RESOURCE':
      return 'link';
    case 'FLASHCARD_REMINDER':
      return 'layers';
    default:
      return 'bell';
  }
}

export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
