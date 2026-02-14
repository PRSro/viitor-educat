/**
 * Admin Dashboard
 * 
 * Admin-only access. Features:
 * - View list of users (without sensitive data)
 * - View analytics and platform statistics
 * - Manage courses, users, and settings
 * - View platform-wide progress
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Users, Server, Settings, Activity, Shield, BookOpen, FileText, GraduationCap, TrendingUp, BarChart3 } from 'lucide-react';
import { api, checkApiHealth, ApiError } from '@/lib/apiClient';
import { ErrorDisplay, ErrorType } from '@/components/ErrorDisplay';
import { getOverviewAnalytics, getAnalyticsTrends, getPopularCourses } from '@/services/analyticsService';

interface AdminUser {
  id: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  createdAt: string;
}

interface SystemStatus {
  apiHealth: boolean;
  lastChecked: Date | null;
  userCount: number;
}

interface OverviewData {
  users: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
  };
  courses: {
    total: number;
    published: number;
    drafts: number;
    totalEnrollments: number;
    completionRate: number;
  };
  content: {
    lessons: number;
    articles: number;
    flashcards: number;
  };
  recentActivity: {
    enrollmentsLast90Days: number;
    coursesCreatedLast90Days: number;
  };
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: ErrorType; message: string } | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    apiHealth: false,
    lastChecked: null,
    userCount: 0,
  });
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [analytics, setAnalytics] = useState<OverviewData | null>(null);
  const [popularCourses, setPopularCourses] = useState<any[]>([]);

  // Fetch data on mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch users and check health in parallel
      const [usersData, healthOk] = await Promise.all([
        api.get<AdminUser[]>('/admin/users'),
        checkApiHealth(),
      ]);
      
      setUsers(usersData);
      setSystemStatus({
        apiHealth: healthOk,
        lastChecked: new Date(),
        userCount: usersData.length,
      });

      // Fetch analytics data
      try {
        const analyticsData = await getOverviewAnalytics('month');
        setAnalytics(analyticsData);
        
        const courses = await getPopularCourses(5);
        setPopularCourses(courses);
      } catch (analyticsErr) {
        console.warn('Failed to fetch analytics:', analyticsErr);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      if (err instanceof ApiError) {
        setError({ type: err.type, message: err.message });
      } else {
        setError({ 
          type: 'unknown', 
          message: err instanceof Error ? err.message : 'Failed to load admin data' 
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleHealthCheck() {
    setCheckingHealth(true);
    const healthOk = await checkApiHealth();
    setSystemStatus(prev => ({
      ...prev,
      apiHealth: healthOk,
      lastChecked: new Date(),
    }));
    setCheckingHealth(false);
  }

  // Show full-page error for critical failures
  if (error && !loading) {
    return (
      <ErrorDisplay
        type={error.type}
        message={error.message}
        onRetry={fetchAdminData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Logged in as: {user?.email} ({user?.role})
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Server className="w-4 h-4" />
                API Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${systemStatus.apiHealth ? 'bg-green-500' : 'bg-destructive'}`} />
                  <span className="font-semibold">
                    {systemStatus.apiHealth ? 'Online' : 'Offline'}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleHealthCheck}
                  disabled={checkingHealth}
                >
                  <RefreshCw className={`w-4 h-4 ${checkingHealth ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {systemStatus.lastChecked && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last checked: {systemStatus.lastChecked.toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{analytics?.users.total || systemStatus.userCount}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics?.users.students || 0} students, {analytics?.users.teachers || 0} teachers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{analytics?.courses.total || 0}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics?.courses.published || 0} published, {analytics?.courses.drafts || 0} drafts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{analytics?.courses.totalEnrollments || 0}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics?.courses.completionRate || 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{analytics?.content.lessons || 0}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics?.content.articles || 0} articles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Users
                </CardTitle>
                <CardDescription>
                  Manage registered users
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAdminData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground">No users found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={
                          u.role === 'ADMIN' ? 'destructive' : 
                          u.role === 'TEACHER' ? 'default' : 
                          'secondary'
                        }>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Popular Courses */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Popular Courses
                </CardTitle>
                <CardDescription>
                  Most enrolled courses
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {popularCourses.length === 0 ? (
              <p className="text-muted-foreground">No courses yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Lessons</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>{course.teacher?.email}</TableCell>
                      <TableCell>{course._count?.enrollments || 0}</TableCell>
                      <TableCell>{course._count?.lessons || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Placeholder Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Coming soon - Configure system settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will include system configuration options.
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>
                Coming soon - View system activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This section will show recent system activity and audit logs.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
