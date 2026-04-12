import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomService } from '@/modules/core/services/classroomService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, BookOpen, Key, Copy, Check, CopyIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

export function TeacherClassrooms() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: classrooms, isLoading } = useQuery({
    queryKey: ['classrooms'],
    queryFn: classroomService.getClassrooms
  });

  const createMutation = useMutation({
    mutationFn: classroomService.createClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      setIsCreateOpen(false);
      setName('');
      setDescription('');
    }
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-white/5 rounded-xl border border-white/10"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">My Classes</h2>
          <p className="text-sm text-gray-400">Manage your classes and students</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a new class</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Cybersecurity 101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the class"
                />
              </div>
            </div>
            <DialogFooter>
              <Button disabled={createMutation.isPending || name.length < 3} onClick={() => createMutation.mutate({ name, description })}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classrooms?.map(classroom => (
          <Card key={classroom.id} className="border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-1">{classroom.name}</CardTitle>
              {classroom.description && (
                <CardDescription className="line-clamp-2">{classroom.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-between text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-1.5 align-middle">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{classroom._count?.students || 0} students</span>
                </div>
                <div className="flex items-center gap-1.5 align-middle">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <span>{classroom._count?.classroomLessons || 0} lessons</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-between">
                <div>
                  <div className="text-xs text-primary/70 mb-1 flex items-center gap-1"><Key className="h-3 w-3" /> Join Code</div>
                  <div className="font-mono text-lg font-bold text-primary tracking-wider mix-blend-screen">{classroom.joinCode}</div>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/20"
                  onClick={() => copyToClipboard(classroom.joinCode)}
                >
                  {copiedCode === classroom.joinCode ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!classrooms?.length && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-xl">
             <div className="bg-white/5 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
               <Users className="h-6 w-6 text-gray-400" />
             </div>
             <p className="text-gray-400">You haven&apos;t created any classes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
