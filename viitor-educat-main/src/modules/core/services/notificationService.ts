/**
 * Notification Service
 * Handles API calls for user notifications
 */

import { api } from '@/lib/apiClient';
import { API_PATHS } from '@/lib/apiPaths';

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
  return api.get(`${API_PATHS.NOTIFICATIONS}${queryString ? '?' + queryString : ''}`);
}

export async function getUnreadCount(): Promise<number> {
  try {
    const data = await api.get<{ unreadCount: number }>(API_PATHS.NOTIFICATIONS_UNREAD_COUNT);
    return data.unreadCount;
  } catch {
    return 0;
  }
}

export async function createNotification(data: CreateNotificationData): Promise<Notification> {
  const result = await api.post<{ notification: Notification }>(API_PATHS.NOTIFICATIONS, data);
  return result.notification;
}

export async function broadcastNotification(data: BroadcastData): Promise<{ created: number }> {
  return api.post(API_PATHS.NOTIFICATIONS_BROADCAST, data);
}

export async function markAsRead(notificationId: string): Promise<void> {
  await api.patch(API_PATHS.NOTIFICATION_READ(notificationId), {});
}

export async function markAllAsRead(): Promise<void> {
  await api.patch(API_PATHS.NOTIFICATIONS_READ_ALL, {});
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(API_PATHS.NOTIFICATION(notificationId));
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
