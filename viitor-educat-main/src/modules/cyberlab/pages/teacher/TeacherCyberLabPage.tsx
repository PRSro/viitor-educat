import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShieldAlert, Plus, Trash2, Edit, Users, Trophy, Target, TrendingUp, Terminal, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';

interface Challenge {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  points: number;
  description: string;
  hints: string[];
  solveCount?: number;
}

interface Analytics {
  totalChallenges: number;
  totalSolves: number;
  avgSolvesPerChallenge: string;
  topSolvers: Array<{
    userId: string;
    email: string;
    solveCount: number;
    totalPoints: number;
  }>;
}

export function TeacherCyberLabPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('challenges');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    category: 'Web',
    difficulty: 'Easy',
    points: 100,
    description: '',
    hints: '',
    flag: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [challengesRes, analyticsRes] = await Promise.all([
        api.get<{ challenges: Challenge[] }>('/api/teacher/cyberlab/challenges'),
        api.get<Analytics>('/api/teacher/cyberlab/analytics')
      ]);
      setChallenges(challengesRes.challenges);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error('Failed to load CyberLab data', err);
      toast.error('Failed to load CyberLab data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      category: 'Web',
      difficulty: 'Easy',
      points: 100,
      description: '',
      hints: '',
      flag: ''
    });
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      id: challenge.id,
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
      points: challenge.points,
      description: challenge.description,
      hints: challenge.hints.join('\n'),
      flag: ''
    });
    setIsEditOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.id || !formData.title || !formData.flag) {
      toast.error('ID, title, and flag are required');
      return;
    }

    try {
      setSaving(true);
      const hints = formData.hints.split('\n').filter(h => h.trim());
      
      await api.post('/api/teacher/cyberlab/challenges', {
        ...formData,
        hints
      });
      
      toast.success('Challenge created successfully');
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create challenge');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.id || !formData.title) {
      toast.error('ID and title are required');
      return;
    }

    try {
      setSaving(true);
      const hints = formData.hints.split('\n').filter(h => h.trim());
      
      const updateData: any = {
        title: formData.title,
        category: formData.category,
        difficulty: formData.difficulty,
        points: formData.points,
        description: formData.description,
        hints
      };

      if (formData.flag) {
        updateData.flag = formData.flag;
      }

      await api.put(`/api/teacher/cyberlab/challenges/${editingChallenge?.id}`, updateData);
      
      toast.success('Challenge updated successfully');
      setIsEditOpen(false);
      setEditingChallenge(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update challenge');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/teacher/cyberlab/challenges/${id}`);
      toast.success('Challenge deleted successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete challenge');
    }
  };

  const diffColors = {
    Easy: 'bg-green-500/10 text-green-500 border-green-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    Hard: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    Expert: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  const categories = ['Web', 'Crypto', 'Forensics', 'OSINT', 'PWN', 'Reverse', 'Misc'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <Terminal className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">CyberLab Management</h1>
              <p className="text-muted-foreground">Create and manage CTF challenges</p>
            </div>
          </div>
          <Button onClick={openCreate} className="bg-green-500 hover:bg-green-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Challenge
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="aero-glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Challenges</p>
                  <p className="text-2xl font-bold">{analytics?.totalChallenges || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="aero-glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Trophy className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Solves</p>
                  <p className="text-2xl font-bold">{analytics?.totalSolves || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="aero-glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Solves/Challenge</p>
                  <p className="text-2xl font-bold">{analytics?.avgSolvesPerChallenge || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="aero-glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Participants</p>
                  <p className="text-2xl font-bold">{analytics?.topSolvers?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="mt-6">
            <Card className="aero-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  All Challenges
                </CardTitle>
                <CardDescription>
                  Manage your CTF challenges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Solves</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {challenges.map((challenge) => (
                      <TableRow key={challenge.id}>
                        <TableCell className="font-medium">{challenge.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{challenge.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={diffColors[challenge.difficulty]}>
                            {challenge.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>{challenge.points}</TableCell>
                        <TableCell>{challenge.solveCount || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(challenge)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(challenge.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {challenges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No challenges yet. Create your first one!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <Card className="aero-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Solvers
                </CardTitle>
                <CardDescription>
                  Students ranked by CyberLab performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Challenges Solved</TableHead>
                      <TableHead>Total Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics?.topSolvers?.map((solver, index) => (
                      <TableRow key={solver.userId}>
                        <TableCell className="font-bold">
                          {index < 3 ? (
                            <Trophy className={`w-5 h-5 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' :
                              'text-amber-600'
                            }`} />
                          ) : (
                            `#${index + 1}`
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{solver.email}</TableCell>
                        <TableCell>{solver.solveCount}</TableCell>
                        <TableCell className="text-primary font-bold">{solver.totalPoints} pts</TableCell>
                      </TableRow>
                    ))}
                    {(!analytics?.topSolvers || analytics.topSolvers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No solvers yet. Share the challenges with students!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Challenge Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
            <DialogDescription>
              Add a new CTF challenge to the CyberLab
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Challenge ID</label>
                <Input
                  placeholder="e.g., sql-injection-1"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                />
                <p className="text-xs text-muted-foreground">Unique identifier (URL-safe)</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="SQL Injection Basics"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Points</label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe the challenge and what students need to do..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hints (one per line)</label>
              <Textarea
                placeholder="First hint&#10;Second hint&#10;Third hint"
                value={formData.hints}
                onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Flag</label>
              <Input
                placeholder="viitor{flag_format}"
                value={formData.flag}
                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">The exact string students need to submit</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-green-500 hover:bg-green-600">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Challenge Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
            <DialogDescription>
              Update challenge details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Challenge ID</label>
                <Input value={formData.id} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Points</label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hints (one per line)</label>
              <Textarea
                value={formData.hints}
                onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Flag (leave empty to keep current)</label>
              <Input
                placeholder="Leave empty to keep current flag"
                value={formData.flag}
                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
