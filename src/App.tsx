import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
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
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
