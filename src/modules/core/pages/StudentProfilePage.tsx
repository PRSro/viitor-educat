/**
 * Student Profile Page
 * 
 * Shows student profile, enrolled courses with progress, and learning history
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProgressBar } from '@/components/ProgressBar';
import { CourseCard } from '@/components/CourseCard';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Loader2, 
  Save,
  Upload,
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  Target,
  History
} from 'lucide-react';
import { 
  getStudentProfile, 
  updateStudentProfile, 
  uploadStudentProfilePicture,
  StudentProfile as StudentProfileType,
  CourseWithProgress,
  LearningHistoryItem,
  StudentStats
} from '@/modules/core/services/studentService';
import { getToken } from '@/modules/core/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function StudentProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfileType | null>(null);
  const [enrollments, setEnrollments] = useState<CourseWithProgress[]>([]);
  const [learningHistory, setLearningHistory] = useState<LearningHistoryItem[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    avatarUrl: '',
    bio: '',
    learningGoals: '',
    interests: ''
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const data = await getStudentProfile();
        setProfile(data.profile);
        setEnrollments(data.enrollments);
        setLearningHistory(data.learningHistory);
        setStats(data.stats);
        
        if (data.profile) {
          setFormData({
            avatarUrl: data.profile.avatarUrl || '',
            bio: data.profile.bio || '',
            learningGoals: data.profile.learningGoals?.join(', ') || '',
            interests: data.profile.interests?.join(', ') || ''
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = {
        avatarUrl: formData.avatarUrl || null,
        bio: formData.bio || null,
        learningGoals: formData.learningGoals.split(',').map(s => s.trim()).filter(Boolean),
        interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean)
      };

      const response = await updateStudentProfile(data);
      setProfile(response.profile);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const { url } = await uploadStudentProfilePicture(file);
      setFormData({ ...formData, avatarUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">My Profile</h1>
                <p className="text-sm text-muted-foreground">Track your learning journey</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/student">
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  Dashboard
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="outline" size="sm" className="aero-button">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg text-green-800 dark:bg-green-900 dark:text-green-200">
            {success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Avatar className="h-32 w-32 mx-auto border-4 border-primary/20">
                    <AvatarImage src={formData.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                      {user?.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-2xl font-bold mt-4">
                    {user?.email?.split('@')[0]}
                  </h2>
                  <Badge variant="secondary" className="mt-2">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Student
                  </Badge>
                  <p className="text-muted-foreground flex items-center justify-center gap-1 mt-2">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </p>
                </div>

                {/* Stats */}
                {stats && (
                  <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-2xl font-bold">{stats.totalCoursesEnrolled}</p>
                      <p className="text-xs text-muted-foreground">Courses</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-2xl font-bold">{stats.totalLessonsCompleted}</p>
                      <p className="text-xs text-muted-foreground">Lessons</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-2xl font-bold">{stats.coursesCompleted}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/student">
                      <BookOpen className="h-4 w-4 mr-2" />
                      My Courses
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="courses" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="courses" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  My Courses
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
              </TabsList>

              {/* Courses Tab */}
              <TabsContent value="courses" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Enrolled Courses</h2>
                  <p className="text-muted-foreground">Continue learning where you left off</p>
                </div>

                {enrollments.length === 0 ? (
                  <Card className="p-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Browse courses and start learning!
                    </p>
                    <Button onClick={() => navigate('/student')}>
                      Browse Courses
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {enrollments.map((enrollment) => (
                      <CourseCard
                        key={enrollment.id}
                        course={enrollment.course}
                        progress={enrollment.progress}
                        showProgress
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Learning History</h2>
                  <p className="text-muted-foreground">Recently completed lessons</p>
                </div>

                {learningHistory.length === 0 ? (
                  <Card className="p-12 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No completed lessons yet</h3>
                    <p className="text-muted-foreground">
                      Start learning to see your progress here
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {learningHistory.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium">{item.lesson.title}</p>
                              {item.lesson.courseTitle && (
                                <p className="text-sm text-muted-foreground">
                                  {item.lesson.courseTitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Profile Settings</h2>
                  <p className="text-muted-foreground">Manage your profile information</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                    <CardDescription>Upload a profile picture to personalize your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={formData.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user?.email?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Upload Photo
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          JPEG, PNG, GIF, WebP max 5MB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <form onSubmit={handleSubmit}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="learningGoals">Learning Goals</Label>
                        <Input
                          id="learningGoals"
                          value={formData.learningGoals}
                          onChange={(e) => setFormData({ ...formData, learningGoals: e.target.value })}
                          placeholder="Web development, Data Science, etc."
                        />
                        <p className="text-xs text-muted-foreground">
                          Separate multiple goals with commas
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="interests">Interests</Label>
                        <Input
                          id="interests"
                          value={formData.interests}
                          onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                          placeholder="Programming, Math, Design, etc."
                        />
                        <p className="text-xs text-muted-foreground">
                          Separate multiple interests with commas
                        </p>
                      </div>

                      <Button type="submit" disabled={saving} className="mt-4">
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
