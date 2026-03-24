import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomService } from '@/modules/core/services/classroomService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, BookOpen, UserCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

export function StudentClassrooms() {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: classrooms, isLoading } = useQuery({
    queryKey: ['classrooms'],
    queryFn: classroomService.getClassrooms
  });

  const joinMutation = useMutation({
    mutationFn: classroomService.joinClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      setIsJoinOpen(false);
      setJoinCode('');
      setJoinError(null);
    },
    onError: (error: any) => {
      setJoinError(error.response?.data?.error || 'A apărut o eroare la înscriere');
    }
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-white/5 rounded-xl border border-white/10"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Clasele mele</h2>
          <p className="text-sm text-gray-400">Vezi clasele unde ai fost înscris</p>
        </div>
        
        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="h-4 w-4 mr-2" /> Alătură-te unei clase
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Alătură-te folosind codul primit</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Label htmlFor="code" className="text-gray-300">Codul Clasei (format din 6 caractere)</Label>
              <Input
                id="code"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError(null);
                }}
                maxLength={6}
                className="font-mono text-center tracking-[0.5em] text-2xl uppercase"
                placeholder="XXXXXX"
              />
              {joinError && (
                 <p className="text-sm text-red-400">{joinError}</p>
              )}
            </div>
            <DialogFooter>
              <Button disabled={joinMutation.isPending || joinCode.length !== 6} onClick={() => joinMutation.mutate(joinCode)}>
                {joinMutation.isPending ? 'Se verifică...' : 'Alătură-te'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classrooms?.map(classroom => (
          <Card key={classroom.id} className="border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
            <CardHeader className="pb-3">
               {classroom.teacher?.email && (
                 <div className="flex items-center gap-2 mb-2">
                   <UserCircle2 className="h-4 w-4 text-emerald-400" />
                   <span className="text-xs font-semibold text-emerald-300">{classroom.teacher.email.split('@')[0]}</span>
                 </div>
               )}
              <CardTitle className="text-lg line-clamp-1">{classroom.name}</CardTitle>
              {classroom.description && (
                <CardDescription className="line-clamp-2">{classroom.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pb-2">
               <div className="p-3 mt-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-between">
                <div className="flex gap-2 items-center text-cyan-300">
                   <BookOpen className="h-4 w-4" /> 
                   <span className="text-sm font-medium">{classroom._count?.classroomLessons || 0} de lecții primite</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!classrooms?.length && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-xl">
             <div className="bg-white/5 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
               <Users className="h-6 w-6 text-gray-400" />
             </div>
             <p className="text-gray-400">Nu ești înscris în nicio clasă momentan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
