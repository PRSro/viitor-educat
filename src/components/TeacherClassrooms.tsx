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
          <h2 className="text-xl font-semibold">Clasele mele</h2>
          <p className="text-sm text-gray-400">Gestionează-ți clasele și studenții</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="h-4 w-4 mr-2" /> Crează Clasă
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crează o clasă nouă</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Numele Clasei</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Matematică clasa 10-a C"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descriere (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Scurtă descriere a clasei"
                />
              </div>
            </div>
            <DialogFooter>
              <Button disabled={createMutation.isPending || name.length < 3} onClick={() => createMutation.mutate({ name, description })}>
                {createMutation.isPending ? 'Se crează...' : 'Crează'}
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
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span>{classroom._count?.students || 0} studenți</span>
                </div>
                <div className="flex items-center gap-1.5 align-middle">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <span>{classroom._count?.classroomLessons || 0} lecții</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-300/70 mb-1 flex items-center gap-1"><Key className="h-3 w-3" /> Cod de Alăturare</div>
                  <div className="font-mono text-lg font-bold text-emerald-400 tracking-wider mix-blend-screen">{classroom.joinCode}</div>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/20"
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
             <p className="text-gray-400">Nu ai creat nicio clasă încă.</p>
          </div>
        )}
      </div>
    </div>
  );
}
