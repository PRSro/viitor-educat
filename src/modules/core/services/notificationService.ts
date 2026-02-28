/**
 * Notification Service
 * Handles API calls for user notifications
 */

import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  courseId?: string;
  userIds?: string[];
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'ngrok-skip-browser-warning': 'true',
  };
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
  const url = `${API_BASE_URL}/notifications${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
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
    return 0;
  }

  return data.unreadCount;
}

export async function createNotification(data: CreateNotificationData): Promise<Notification> {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create notification');
  }

  return result.notification;
}

export async function broadcastNotification(data: BroadcastData): Promise<{ created: number }> {
  const response = await fetch(`${API_BASE_URL}/notifications/broadcast`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to broadcast notification');
  }

  return result;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
}

export async function markAllAsRead(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
}

export function getNotificationIcon(type: Notification['type']): string {
  switch (type) {
    case 'COURSE_UPDATE':
      return 'book';
    case 'NEW_ARTICLE':
      return 'file-text';
    case 'NEW_RESOURCE':
      return 'link';
    case 'FLASHCARD_REMINDER':
      return 'layers';
    case 'ENROLLMENT':
      return 'user-plus';
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
