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
import AccessDenied from "@/modules/core/pages/AccessDenied";
import NotFound from "@/modules/core/pages/NotFound";
import Profile from "@/modules/core/pages/Profile";
import Teachers from "@/modules/core/pages/Teachers";
import TeacherProfilePage from "@/modules/core/pages/TeacherProfile";
import ArticlesPage from "@/modules/articles/pages/ArticlesPage";
import ResourcesPage from "@/modules/core/pages/ResourcesPage";
import FlashcardsPage from "@/modules/core/pages/FlashcardsPage";
import StudyDashboard from "@/modules/core/pages/StudyDashboard";
import SettingsPage from "@/modules/core/pages/SettingsPage";
import StudentProfilePage from "@/modules/core/pages/StudentProfilePage";
import LessonViewerPage from "@/modules/lessons/pages/LessonViewerPage";
import SearchPage from "@/modules/core/pages/SearchPage";
import ArticleEditorPage from "@/modules/articles/pages/ArticleEditorPage";
import CourseEditorPage from "@/modules/courses/pages/CourseEditorPage";
import LessonEditorPage from "@/modules/lessons/pages/LessonEditorPage";

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
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/access-denied" element={<AccessDenied />} />

                      {/* Protected Routes - Admin Only */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/access-denied">
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Routes - Teacher Only */}
                      <Route
                        path="/teacher"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER']}>
                            <TeacherDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Routes - Student Only */}
                      <Route
                        path="/student"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT']}>
                            <StudentDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Course Detail - All authenticated users */}
                      <Route
                        path="/courses/:slug"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <CourseDetail />
                          </ProtectedRoute>
                        }
                      />

                      {/* Profile - All authenticated users */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <Profile />
                          </ProtectedRoute>
                        }
                      />

                      {/* Article Detail - All authenticated users */}
                      <Route
                        path="/articles/:slug"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ArticleDetail />
                          </ProtectedRoute>
                        }
                      />

                      {/* Teachers - All authenticated users */}
                      <Route
                        path="/teachers"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <Teachers />
                          </ProtectedRoute>
                        }
                      />

                      {/* Teacher Profile - All authenticated users */}
                      <Route
                        path="/teachers/:teacherId"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <TeacherProfilePage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Articles Page - All authenticated users */}
                      <Route
                        path="/student/articles"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ArticlesPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Resources Page - All authenticated users */}
                      <Route
                        path="/student/resources"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <ResourcesPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Flashcards Page - All authenticated users */}
                      <Route
                        path="/student/flashcards"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <FlashcardsPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Study Dashboard - Student only */}
                      <Route
                        path="/student/study"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <StudyDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Settings Page - All authenticated users */}
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <SettingsPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Student Profile - Students only */}
                      <Route
                        path="/student/profile"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT']}>
                            <StudentProfilePage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Lesson Viewer - All authenticated users */}
                      <Route
                        path="/lessons/:lessonId"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <LessonViewerPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Search - All authenticated users */}
                      <Route
                        path="/search"
                        element={
                          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                            <SearchPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Article Editor - Teacher/Admin only */}
                      <Route
                        path="/articles/new"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <ArticleEditorPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/articles/:slug/edit"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <ArticleEditorPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Course Editor - Teacher/Admin only */}
                      <Route
                        path="/courses/new"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <CourseEditorPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/courses/:courseId/edit"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <CourseEditorPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Lesson Editor - Teacher/Admin only */}
                      <Route
                        path="/courses/:courseId/lessons/new"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <LessonEditorPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/courses/:courseId/lessons/:lessonId/edit"
                        element={
                          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                            <LessonEditorPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
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
