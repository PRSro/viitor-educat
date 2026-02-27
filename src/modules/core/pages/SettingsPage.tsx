/**
 * Settings Page
 * Comprehensive settings management with tabs for different categories
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Settings,
  Palette,
  BookOpen,
  Bell,
  Shield,
  Wrench,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Save,
  Loader2,
  ArrowLeft,
  User,
  GraduationCap,
  FileText,
  Link as LinkIcon,
  Layers,
  Check
} from 'lucide-react';
import {
  Theme,
  DashboardView,
  ContentPriority,
  ResourceType,
  themeLabels,
  dashboardViewLabels,
  categoryLabels,
  UserSettings,
  UpdateSettingsData
} from '@/modules/core/services/settingsService';

const categories = Object.keys(categoryLabels);

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { settings, loading, updateUserSettings, resetUserSettings, isSettingsLoaded } = useSettings();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Partial<UserSettings>>({});

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateUserSettings(localSettings as UpdateSettingsData);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      await resetUserSettings();
      toast.success('Settings reset to defaults');
      navigate('/student');
    } catch (err) {
      toast.error('Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const updateLocalSetting = (key: keyof UserSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!isSettingsLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/student">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Settings
                </h1>
                <p className="text-muted-foreground">
                  Manage your preferences and account settings
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={saving}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all your settings to their default values. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Reset Settings
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Study</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            {isTeacher && (
              <TabsTrigger value="teacher" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Teacher Tools</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how the application looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
                      <div
                        key={theme}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${localSettings.theme === theme
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent hover:bg-muted/50'
                          }`}
                        onClick={() => updateLocalSetting('theme', theme)}
                      >
                        {theme === 'light' && <Sun className="h-6 w-6" />}
                        {theme === 'dark' && <Moon className="h-6 w-6" />}
                        {theme === 'system' && <Monitor className="h-6 w-6" />}
                        <span className="text-sm font-medium">{themeLabels[theme]}</span>
                        {localSettings.theme === theme && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-3">
                  <Label>Language</Label>
                  <Select
                    value={localSettings.language || 'en'}
                    onValueChange={(value) => updateLocalSetting('language', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ro">Română</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dashboard Preferences</CardTitle>
                <CardDescription>
                  Configure your default dashboard view and content priority
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Dashboard View */}
                <div className="space-y-3">
                  <Label>Default Dashboard View</Label>
                  <Select
                    value={localSettings.defaultDashboardView || 'courses'}
                    onValueChange={(value) => updateLocalSetting('defaultDashboardView', value)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select default view" />
                    </SelectTrigger>
                    <SelectContent>
                      {(['courses', 'articles', 'resources', 'flashcards'] as DashboardView[]).map((view) => (
                        <SelectItem key={view} value={view}>
                          {dashboardViewLabels[view]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Priority */}
                <div className="space-y-3">
                  <Label>Content Priority</Label>
                  <Select
                    value={localSettings.contentPriority || 'courses'}
                    onValueChange={(value) => updateLocalSetting('contentPriority', value)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="courses">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Courses over Teacher Profiles
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher_profiles">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Teacher Profiles over Courses
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Study Preferences Tab */}
          <TabsContent value="study" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Sections</CardTitle>
                <CardDescription>
                  Choose which sections to show in your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Show Articles</Label>
                      <p className="text-sm text-muted-foreground">Display articles in your dashboard</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.showArticles ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('showArticles', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Show Flashcards</Label>
                      <p className="text-sm text-muted-foreground">Display flashcards in your dashboard</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.showFlashcards ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('showFlashcards', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Show Resources</Label>
                      <p className="text-sm text-muted-foreground">Display external resources in your dashboard</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.showResources ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('showResources', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferred Categories</CardTitle>
                <CardDescription>
                  Select your preferred content categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={(localSettings.preferredCategories || []).includes(category)
                        ? 'default'
                        : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = localSettings.preferredCategories || [];
                        const updated = current.includes(category)
                          ? current.filter((c: string) => c !== category)
                          : [...current, category];
                        updateLocalSetting('preferredCategories', updated);
                      }}
                    >
                      {categoryLabels[category]}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hidden Content</CardTitle>
                <CardDescription>
                  Filter out categories or tags you don't want to see
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Hidden Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={`hidden-${category}`}
                        variant={(localSettings.hiddenCategories || []).includes(category)
                          ? 'destructive'
                          : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = localSettings.hiddenCategories || [];
                          const updated = current.includes(category)
                            ? current.filter((c: string) => c !== category)
                            : [...current, category];
                          updateLocalSetting('hiddenCategories', updated);
                        }}
                      >
                        {categoryLabels[category]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Manage your email notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications</p>
                  </div>
                  <Switch
                    checked={localSettings.emailNotifications ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Course Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about course updates</p>
                  </div>
                  <Switch
                    checked={localSettings.courseUpdates ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('courseUpdates', checked)}
                    disabled={!localSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Articles</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new articles</p>
                  </div>
                  <Switch
                    checked={localSettings.newArticles ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('newArticles', checked)}
                    disabled={!localSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Resources</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new resources</p>
                  </div>
                  <Switch
                    checked={localSettings.newResources ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('newResources', checked)}
                    disabled={!localSettings.emailNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Study Reminders</CardTitle>
                <CardDescription>
                  Set up reminders to stay on track with your studies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Study Reminders</Label>
                    <p className="text-sm text-muted-foreground">Enable daily study reminders</p>
                  </div>
                  <Switch
                    checked={localSettings.studyReminderEnabled ?? false}
                    onCheckedChange={(checked) => updateLocalSetting('studyReminderEnabled', checked)}
                  />
                </div>

                {localSettings.studyReminderEnabled && (
                  <div className="space-y-3">
                    <Label>Reminder Time</Label>
                    <Input
                      type="time"
                      className="w-32"
                      value={localSettings.studyReminderTime || '09:00'}
                      onChange={(e) => updateLocalSetting('studyReminderTime', e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Flashcard Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded to review flashcards</p>
                  </div>
                  <Switch
                    checked={localSettings.flashcardReminders ?? false}
                    onCheckedChange={(checked) => updateLocalSetting('flashcardReminders', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Visibility</CardTitle>
                <CardDescription>
                  Control who can see your profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Profile</Label>
                    <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
                  </div>
                  <Switch
                    checked={localSettings.showProfile ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('showProfile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Progress</Label>
                    <p className="text-sm text-muted-foreground">Display your learning progress</p>
                  </div>
                  <Switch
                    checked={localSettings.showProgress ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('showProgress', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Help us improve by sharing usage data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Analytics</Label>
                    <p className="text-sm text-muted-foreground">Share anonymous usage data to help us improve</p>
                  </div>
                  <Switch
                    checked={localSettings.allowAnalytics ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('allowAnalytics', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teacher Tools Tab */}
          {isTeacher && (
            <TabsContent value="teacher" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Dashboard</CardTitle>
                  <CardDescription>
                    Configure your teaching experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Expand Teacher Tools</Label>
                      <p className="text-sm text-muted-foreground">Show teacher tools by default</p>
                    </div>
                    <Switch
                      checked={localSettings.teacherToolsExpanded ?? false}
                      onCheckedChange={(checked) => updateLocalSetting('teacherToolsExpanded', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Default Resource Type</CardTitle>
                  <CardDescription>
                    Set your preferred resource type when adding new resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localSettings.defaultResourceType || 'LINK'}
                    onValueChange={(value) => updateLocalSetting('defaultResourceType', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select resource type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LINK">External Link</SelectItem>
                      <SelectItem value="YOUTUBE">YouTube Video</SelectItem>
                      <SelectItem value="PDF">PDF Document</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
