/**
 * Settings Page
 * Comprehensive settings management with tabs for different categories
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PageBackground } from '@/components/PageBackground';
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
    <PageBackground>
      {/* Header */}
      <header className="backdrop-blur-md bg-card/30 border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/student">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Înapoi
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Setări
                </h1>
                <p className="text-muted-foreground">
                  Administrează preferințele și setările contului tău
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={saving}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resetează
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resetează Setările</AlertDialogTitle>
                    <AlertDialogDescription>
                      Această acțiune va reseta toate setările la valorile implicite. Această acțiune este ireversibilă.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anulează</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Resetează Setările
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
                Salvează Modificările
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
              <span className="hidden sm:inline">Studiu</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificări</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Confidențialitate</span>
            </TabsTrigger>
            {isTeacher && (
              <TabsTrigger value="teacher" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Unelte Profesor</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Aspect
                </CardTitle>
                <CardDescription>
                  Personalizează modul în care aplicația arată
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div className="space-y-3">
                  <Label>Temă</Label>
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
                  <Label>Limbă</Label>
                  <Select
                    value={localSettings.language || 'ro'}
                    onValueChange={(value) => updateLocalSetting('language', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selectează limba" />
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
                <CardTitle>Preferințe Dashboard</CardTitle>
                <CardDescription>
                  Configurează vederea implicită a dashboard-ului
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Dashboard View */}
                <div className="space-y-3">
                  <Label>Vedere Implicită Dashboard</Label>
                  <Select
                    value={localSettings.defaultDashboardView || 'lessons'}
                    onValueChange={(value) => updateLocalSetting('defaultDashboardView', value)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Selectează vederea" />
                    </SelectTrigger>
                    <SelectContent>
                      {(['lessons', 'articles', 'resources', 'flashcards'] as DashboardView[]).map((view) => (
                        <SelectItem key={view} value={view}>
                          {dashboardViewLabels[view]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Priority */}
                <div className="space-y-3">
                  <Label>Prioritate Conținut</Label>
                  <Select
                    value={localSettings.contentPriority || 'lessons'}
                    onValueChange={(value) => updateLocalSetting('contentPriority', value)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Selectează prioritatea" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lessons">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Lecții înaintea Profilurilor de Profesori
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher_profiles">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Profiluri de Profesori înaintea Lecțiilor
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
                <CardTitle>Secțiuni Dashboard</CardTitle>
                <CardDescription>
                  Alege ce secțiuni să apară în dashboard-ul tău
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Arată Articole</Label>
                      <p className="text-sm text-muted-foreground">Afișează articolele în dashboard</p>
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
                      <Label>Arată Flashcard-uri</Label>
                      <p className="text-sm text-muted-foreground">Afișează flashcard-urile în dashboard</p>
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
                      <Label>Arată Resurse</Label>
                      <p className="text-sm text-muted-foreground">Afișează resursele externe în dashboard</p>
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
                <CardTitle>Categorii Preferate</CardTitle>
                <CardDescription>
                  Selectează categoriile de conținut preferate
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
                <CardTitle>Conținut Ascuns</CardTitle>
                <CardDescription>
                  Filtrează categoriile sau tag-urile pe care nu vrei să le vezi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Categorii Ascunse</Label>
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
                <CardTitle>Notificări Email</CardTitle>
                <CardDescription>
                  Administrează preferințele pentru notificările pe email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificări Email</Label>
                    <p className="text-sm text-muted-foreground">Primește notificări prin email</p>
                  </div>
                  <Switch
                    checked={localSettings.emailNotifications ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Actualizări Lecții</Label>
                    <p className="text-sm text-muted-foreground">Primește notificări despre actualizări ale lecțiilor</p>
                  </div>
                  <Switch
                    checked={localSettings.lessonUpdates ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('lessonUpdates', checked)}
                    disabled={!localSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Articole Noi</Label>
                    <p className="text-sm text-muted-foreground">Fii notificat despre articole noi</p>
                  </div>
                  <Switch
                    checked={localSettings.newArticles ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('newArticles', checked)}
                    disabled={!localSettings.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Resurse Noi</Label>
                    <p className="text-sm text-muted-foreground">Fii notificat despre resurse noi</p>
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
                <CardTitle>Mementouri Studiu</CardTitle>
                <CardDescription>
                  Setează mementouri pentru a rămâne consecvent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mementouri Studiu</Label>
                    <p className="text-sm text-muted-foreground">Activează mementourile zilnice</p>
                  </div>
                  <Switch
                    checked={localSettings.studyReminderEnabled ?? false}
                    onCheckedChange={(checked) => updateLocalSetting('studyReminderEnabled', checked)}
                  />
                </div>

                {localSettings.studyReminderEnabled && (
                  <div className="space-y-3">
                    <Label>Ora Mementoului</Label>
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
                    <Label>Mementouri Flashcard-uri</Label>
                    <p className="text-sm text-muted-foreground">Primește mementouri pentru repetarea flashcard-urilor</p>
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
                <CardTitle>Vizibilitate Profil</CardTitle>
                <CardDescription>
                  Controlează cine îți poate vedea profilul
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Arată Profilul</Label>
                    <p className="text-sm text-muted-foreground">Permite altora să îți vadă profilul</p>
                  </div>
                  <Switch
                    checked={localSettings.showProfile ?? true}
                    onCheckedChange={(checked) => updateLocalSetting('showProfile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Arată Progresul</Label>
                    <p className="text-sm text-muted-foreground">Afișează progresul tău în învățare</p>
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
                <CardTitle>Analitice</CardTitle>
                <CardDescription>
                  Ajută-ne să îmbunătățim platforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permite Analitice</Label>
                    <p className="text-sm text-muted-foreground">Partajează date anonime de utilizare</p>
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
                  <CardTitle>Dashboard Profesor</CardTitle>
                  <CardDescription>
                    Configurează experiența ta de predare
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Extinde Uneltele Profesor</Label>
                      <p className="text-sm text-muted-foreground">Arată automat uneltele de profesor</p>
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
                  <CardTitle>Tip Resursă Implicit</CardTitle>
                  <CardDescription>
                    Setează tipul preferat de resursă la adăugarea uneia noi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localSettings.defaultResourceType || 'LINK'}
                    onValueChange={(value) => updateLocalSetting('defaultResourceType', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selectează tipul" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LINK">Link Extern</SelectItem>
                      <SelectItem value="YOUTUBE">Video YouTube</SelectItem>
                      <SelectItem value="PDF">Document PDF</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </PageBackground>
  );
}
