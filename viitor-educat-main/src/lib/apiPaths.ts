/**
 * Centralized API Endpoint Paths
 * All frontend services should import paths from here
 */

export const API_PATHS = {
  // Auth (no /api prefix - registered at root)
  AUTH_ME: '/auth/me',
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGOUT: '/auth/logout',

  // Lessons
  LESSONS: '/api/lessons',
  LESSONS_PRIVATE: '/api/lessons/private',
  LESSONS_TEACHER: (teacherId: string) => `/api/lessons/teacher/${teacherId}`,
  LESSON: (id: string) => `/api/lessons/${id}`,
  LESSON_VIEW: (id: string) => `/api/lessons/${id}/view`,
  LESSON_COMPLETE: (id: string) => `/api/lessons/${id}/complete`,
  LESSON_ANSWER: (lessonId: string, questionId: string) => `/api/lessons/${lessonId}/questions/${questionId}/answer`,
  LESSON_COMMENTS: (lessonId: string) => `/api/lessons/${lessonId}/comments`,

  // Articles
  ARTICLES: '/api/articles',
  ARTICLES_LATEST: '/api/articles/latest',
  ARTICLES_CATEGORIES: '/api/articles/categories',
  ARTICLE: (id: string) => `/api/articles/${id}`,
  ARTICLE_IMPORT: '/api/articles/import',
  ARTICLES_TEACHER: (teacherId: string) => `/api/articles/teacher/${teacherId}`,

  // CyberLab
  CYBERLAB_CHALLENGES: '/api/cyberlab/challenges',
  CYBERLAB_SUBMIT: (id: string) => `/api/cyberlab/challenges/${id}/submit`,
  TEACHER_CYBERLAB: '/api/teacher/cyberlab',
  TEACHER_CYBERLAB_ANALYTICS: '/api/teacher/cyberlab/analytics',
  TEACHER_CYBERLAB_SOLVES: '/api/teacher/cyberlab/solves',
  TEACHER_CYBERLAB_CHALLENGE: (id: string) => `/api/teacher/cyberlab/challenges/${id}`,

  // Student
  STUDENT_PROGRESS: '/api/student/progress',
  STUDENT_COMPLETIONS: '/api/student/completions',
  PROFILE_STUDENT: '/api/profiles/student',

  // Analytics
  ANALYTICS_OVERVIEW: '/api/analytics/overview',
  ANALYTICS_TRENDS: '/api/analytics/trends',
  ANALYTICS_TEACHERS: '/api/analytics/teachers',
  ANALYTICS_STUDENTS: '/api/analytics/students',
  ANALYTICS_CONTENT: '/api/analytics/content',
  ANALYTICS_STUDENT_HEATMAP: '/api/analytics/student/heatmap',
  ANALYTICS_TEACHER_OVERVIEW: '/api/analytics/teacher/overview',
  ANALYTICS_LESSONS: '/api/analytics/lessons',
  ANALYTICS_STUDENTS_ACTIVE: '/api/analytics/students/active',
  ANALYTICS_QUIZZES: '/api/analytics/quizzes',

  // Bookmarks
  BOOKMARKS: '/api/bookmarks',
  BOOKMARK: (resourceType: string, resourceId: string) => `/api/bookmarks/${resourceType}/${resourceId}`,

  // Profile (no /api prefix - registered at root)
  PROFILE: '/api/profile',
  PROFILE_TEACHERS: '/api/profile/teachers',
  PROFILE_TEACHER: (teacherId: string) => `/api/profile/${teacherId}`,
  PROFILE_TEACHER_ARTICLES: (teacherId: string) => `/api/profile/${teacherId}/articles`,
  PROFILE_TEACHER_LESSONS: (teacherId: string) => `/api/profile/${teacherId}/lessons`,
  PROFILE_PICTURE: '/api/upload/profile-picture',

  // Settings
  SETTINGS: '/api/settings',
  SETTINGS_CATEGORIES: '/api/settings/categories',
  SETTINGS_RESET: '/api/settings/reset',

  // Resources
  RESOURCES: '/api/resources',
  RESOURCE: (id: string) => `/api/resources/${id}`,
  RESOURCES_LESSON: (lessonId: string) => `/api/resources/lesson/${lessonId}`,
  RESOURCES_TEACHER: (teacherId: string) => `/api/resources/teacher/${teacherId}`,
  RESOURCES_TYPES: '/api/resources/types',

  // Flashcards
  FLASHCARDS: '/api/flashcards',
  FLASHCARD: (id: string) => `/api/flashcards/${id}`,
  FLASHCARDS_LESSON: (lessonId: string) => `/api/flashcards/lesson/${lessonId}`,
  FLASHCARDS_STUDY: '/api/flashcards/study',
  FLASHCARDS_STUDY_PROMPTS: '/api/flashcards/study/prompts',
  FLASHCARDS_BULK: '/api/flashcards/bulk',

  // Leaderboard
  LEADERBOARD: '/api/leaderboard',
  LEADERBOARD_ME: '/api/leaderboard/me',

  // Classrooms
  CLASSROOMS: '/api/classrooms',
  CLASSROOM: (id: string) => `/api/classrooms/${id}`,
  CLASSROOM_JOIN: (code: string) => `/api/classrooms/join/${code}`,

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATION: (id: string) => `/api/notifications/${id}`,
  NOTIFICATIONS_UNREAD_COUNT: '/api/notifications/unread-count',
  NOTIFICATIONS_BROADCAST: '/api/notifications/broadcast',
  NOTIFICATION_READ: (id: string) => `/api/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/api/notifications/read-all',

  // Quizzes
  QUIZZES: '/api/quizzes',
  QUIZ: (id: string) => `/api/quizzes/${id}`,
  QUIZ_ATTEMPT: (id: string) => `/api/quizzes/${id}/attempt`,
  QUIZ_ATTEMPTS_STUDENT: '/api/quizzes/student/my-attempts',
  QUIZZES_TEACHER: '/api/quizzes/teacher/my-quizzes',

  // Comments
  COMMENT: (id: string) => `/api/comments/${id}`,

  // Search
  SEARCH: '/api/search',
  SEARCH_SUGGESTIONS: '/api/search/suggestions',
  SEARCH_FILTERS: '/api/search/filters',
} as const;
