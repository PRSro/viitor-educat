import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Calendar, Loader2, Save, Moon, Sun, Camera, Upload, Globe, Linkedin, Twitter, BookOpen, GraduationCap, ArrowRight, LayoutDashboard } from 'lucide-react';
import { getProfile, uploadProfilePicture, User as UserType, TeacherProfile as TeacherProfileType } from '@/services/authService';
import { getToken } from '@/services/authService';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface TeacherProfile {
  id: string;
  bio: string | null;
  pictureUrl: string | null;
  phone: string | null;
  office: string | null;
  officeHours: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Redirect students to student profile page
  useEffect(() => {
    if (user?.role === 'STUDENT') {
      navigate('/student/profile');
    }
  }, [user, navigate]);
  
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    bio: '',
    pictureUrl: '',
    phone: '',
    office: '',
    officeHours: '',
    website: '',
    linkedin: '',
    twitter: ''
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getProfile();
        setProfile(data.profile);
        if (data.profile) {
          setFormData({
            bio: data.profile.bio || '',
            pictureUrl: data.profile.pictureUrl || '',
            phone: data.profile.phone || '',
            office: data.profile.office || '',
            officeHours: data.profile.officeHours || '',
            website: data.profile.website || '',
            linkedin: data.profile.linkedin || '',
            twitter: data.profile.twitter || ''
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

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          bio: formData.bio || null,
          pictureUrl: formData.pictureUrl || null,
          phone: formData.phone || null,
          office: formData.office || null,
          officeHours: formData.officeHours || null,
          website: formData.website || null,
          linkedin: formData.linkedin || null,
          twitter: formData.twitter || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update profile');
      }

      setProfile(data.profile);
      setSuccess('Profil actualizat cu succes!');
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
      const { url } = await uploadProfilePicture(file);
      setFormData({ ...formData, pictureUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'TEACHER':
        return 'Profesor';
      case 'STUDENT':
        return 'Elev';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'STUDENT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="aero-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profilul Meu
            </CardTitle>
            <CardDescription>
              Gestionează informațiile contului tău
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm">
                {success}
              </div>
            )}

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profil
                </TabsTrigger>
                {user?.role === 'TEACHER' && (
                  <TabsTrigger value="teacher" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Profesor
                  </TabsTrigger>
                )}
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  Setări
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                {/* Dashboard Navigation */}
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const dashboardPath = 
                        user?.role === 'ADMIN' ? '/admin' :
                        user?.role === 'TEACHER' ? '/teacher' : 
                        '/student';
                      navigate(dashboardPath);
                    }}
                    className="flex items-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{profile?.email || user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Rol</Label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getRoleColor(profile?.role || user?.role || '')}`}>
                        {getRoleLabel(profile?.role || user?.role || '')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Membru din</Label>
                      <p className="font-medium">
                        {profile?.createdAt || user?.createdAt
                          ? new Date(profile?.createdAt || user?.createdAt || '').toLocaleDateString('ro-RO', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" onClick={logout}>
                    Deconectare
                  </Button>
                </div>
              </TabsContent>

              {user?.role === 'TEACHER' && (
                <TabsContent value="teacher">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Fotografie Profil</Label>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted aero-glass flex items-center justify-center">
                            {formData.pictureUrl ? (
                              <img 
                                src={formData.pictureUrl} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
                                }}
                              />
                            ) : (
                              <User className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
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
                              className="aero-button"
                            >
                              {uploading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              Încarcă Fotografie
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              JPEG, PNG, GIF, WebP max 5MB
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+40 123 456 789"
                          className="aero-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Biografie</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Spune ceva despre tine..."
                        rows={4}
                        className="aero-input"
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="office">Birou</Label>
                        <Input
                          id="office"
                          value={formData.office}
                          onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                          placeholder="Camera 301, Corp A"
                          className="aero-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="officeHours">Ore de Consulță</Label>
                        <Input
                          id="officeHours"
                          value={formData.officeHours}
                          onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                          placeholder="Luni-Vineri, 10:00-14:00"
                          className="aero-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Link-uri Sociale</Label>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="Website"
                            className="aero-input"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formData.linkedin}
                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                            placeholder="LinkedIn"
                            className="aero-input"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Twitter className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formData.twitter}
                            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                            placeholder="Twitter"
                            className="aero-input"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={saving} className="aero-button-accent">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Se salvează...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvează Modificările
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              )}

              <TabsContent value="settings">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-1">
                      <p className="font-medium">Tema Întunecată</p>
                      <p className="text-sm text-muted-foreground">
                        Activează modul întunecat pentru interfață
                      </p>
                    </div>
                    <Button
                      variant={isDark ? "default" : "outline"}
                      onClick={toggleTheme}
                      className="aero-button"
                    >
                      {isDark ? (
                        <>
                          <Sun className="h-4 w-4 mr-2" />
                          Luminos
                        </>
                      ) : (
                        <>
                          <Moon className="h-4 w-4 mr-2" />
                          Întunecat
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="outline" onClick={logout} className="aero-button">
                      Deconectare
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
