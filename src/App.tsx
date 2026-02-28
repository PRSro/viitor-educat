import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { DraftProvider } from "@/contexts/DraftContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "@/modules/core/pages/Index";
import Login from "@/modules/core/pages/Login";
import Register from "@/modules/core/pages/Register";
import TeacherDashboard from "@/modules/core/pages/TeacherDashboard";
import StudentDashboard from "@/modules/core/pages/StudentDashboard";
import AdminDashboard from "@/modules/core/pages/AdminDashboard";
import ArticleDetail from "@/modules/articles/pages/ArticleDetail";
import CourseDetail from "@/modules/courses/pages/CourseDetail";
import CoursesPage from "@/modules/courses/pages/CoursesPage";
import AccessDenied from "@/modules/core/pages/AccessDenied";
import NotFound from "@/modules/core/pages/NotFound";
import Profile from "@/modules/core/pages/Profile";
import Teachers from "@/modules/core/pages/Teachers";
import TeacherProfilePage from "@/modules/core/pages/TeacherProfile";
import ArticlesPage from "@/modules/articles/pages/ArticlesPage";
import ResourcesPage from "@/modules/core/pages/ResourcesPage";
import FlashcardsPage from "@/modules/core/pages/FlashcardsPage";
import SettingsPage from "@/modules/core/pages/SettingsPage";
import NewsPage from "@/modules/core/pages/NewsPage";
import StudentProfilePage from "@/modules/core/pages/StudentProfilePage";
import LessonViewerPage from "@/modules/lessons/pages/LessonViewerPage";
import SearchPage from "@/modules/core/pages/SearchPage";
import ArticleEditorPage from "@/modules/articles/pages/ArticleEditorPage";
import CourseEditorPage from "@/modules/courses/pages/CourseEditorPage";
import LessonEditorPage from "@/modules/lessons/pages/LessonEditorPage";
import BookmarksPage from "@/modules/core/pages/BookmarksPage";
import QuizPage from "@/modules/core/pages/QuizPage";
import TeacherDirectoryPage from "@/modules/core/pages/TeacherDirectoryPage";
import ForumPage from '@/pages/ForumPage';
import ForumThreadPage from '@/pages/ForumThreadPage';
import { MusicPlayer } from "@/components/MusicPlayer";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <SettingsProvider>
            <DraftProvider>
              <ErrorBoundary>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                      <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                      <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
                      <Route path="/access-denied" element={<ErrorBoundary><AccessDenied /></ErrorBoundary>} />
                      <Route path="/noutati" element={<ErrorBoundary><NewsPage /></ErrorBoundary>} />
                      <Route path="/profesori" element={<ErrorBoundary><TeacherDirectoryPage /></ErrorBoundary>} />

                      {/* Protected Routes - Admin Only */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/access-denied">
                            <ErrorBoundary><AdminDashboard /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Routes - Teacher Only */}
                      <Route
                        path="/teacher"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER']}>
                            <ErrorBoundary><TeacherDashboard /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Routes - Student Only */}
                      <Route
                        path="/student"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT']}>
                            <ErrorBoundary><StudentDashboard /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Course Detail - All authenticated users */}
                      <Route
                        path="/courses/:slug"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><CourseDetail /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Course Catalog - Public */}
                      <Route
                        path="/courses"
                        element={
                          <ErrorBoundary><CoursesPage /></ErrorBoundary>
                        }
                      />

                      {/* Profile - All authenticated users */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><Profile /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Article Detail - All authenticated users */}
                      <Route
                        path="/articles/:slug"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><ArticleDetail /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Teachers - All authenticated users */}
                      <Route
                        path="/teachers"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><Teachers /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Teacher Profile - All authenticated users */}
                      <Route
                        path="/teachers/:teacherId"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><TeacherProfilePage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Articles Page - All authenticated users */}
                      <Route
                        path="/student/articles"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><ArticlesPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Resources Page - All authenticated users */}
                      <Route
                        path="/student/resources"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><ResourcesPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Flashcards Page - All authenticated users */}
                      <Route
                        path="/student/flashcards"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><FlashcardsPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Settings Page - All authenticated users */}
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><SettingsPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Student Profile - Students only */}
                      <Route
                        path="/student/profile"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT']}>
                            <ErrorBoundary><StudentProfilePage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Lesson Viewer - All authenticated users */}
                      <Route
                        path="/lessons/:lessonId"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><LessonViewerPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Search - All authenticated users */}
                      <Route
                        path="/search"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><SearchPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Article Editor - Teacher/Admin only */}
                      <Route
                        path="/articles/new"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <ErrorBoundary><ArticleEditorPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/articles/:slug/edit"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <ErrorBoundary><ArticleEditorPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Course Editor - Teacher/Admin only */}
                      <Route
                        path="/courses/new"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <ErrorBoundary><CourseEditorPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/courses/:courseId/edit"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <ErrorBoundary><CourseEditorPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Lesson Editor - Teacher/Admin only */}
                      <Route
                        path="/courses/:courseId/lessons/new"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <ErrorBoundary><LessonEditorPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/courses/:courseId/lessons/:lessonId/edit"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <ErrorBoundary><LessonEditorPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Bookmarks Page - All authenticated users */}
                      <Route
                        path="/bookmarks"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><BookmarksPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

                      {/* Quiz Page - All authenticated users */}
                      <Route
                        path="/quizzes/:quizId"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><QuizPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />

/*
                      <Route
                        path="/forum"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><ForumPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/forum/thread/:id"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ErrorBoundary><ForumThreadPage /></ErrorBoundary>
                          </ProtectedRoute>
                        }
                      />
                      */

                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
                    </Routes>
                    {/* <MusicPlayer /> */}
                  </BrowserRouter>
                </TooltipProvider>
              </ErrorBoundary>
            </DraftProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
