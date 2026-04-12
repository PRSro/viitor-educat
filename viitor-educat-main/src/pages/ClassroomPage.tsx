import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { classroomService } from '@/modules/core/services/classroomService';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Users } from 'lucide-react';

export default function ClassroomPage() {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: classroom, isLoading, error } = useQuery({
    queryKey: ['classroom', classroomId],
    queryFn: () => classroomService.getClassroom(classroomId!),
    enabled: !!classroomId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent p-8 flex justify-center mt-20">
        <div className="animate-spin h-8 w-8 border-4 border-violet-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-6 flex flex-col items-center justify-center text-center">
        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-500 uppercase tracking-widest font-bold">
          Failed to load classroom
        </div>
        <Button variant="ghost" className="hover:bg-white/5" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-white/5">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
            {classroom.name}
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            Teacher: <span className="text-white font-medium">{classroom.teacher?.email}</span>
          </p>
        </div>
      </div>

      {classroom.description && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardContent className="pt-6">
            <p className="text-gray-300">{classroom.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-400" />
              Assigned Lessons
            </h2>
            <span className="text-sm bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full">{classroom.classroomLessons?.length ?? 0}</span>
          </div>
          
          <div className="grid gap-3">
            {(classroom.classroomLessons ?? []).map((cl: any) => (
               <Card key={cl.lesson.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => navigate(`/lessons/${cl.lesson.id}`)}>
                 <CardContent className="p-4 flex justify-between items-center">
                   <div className="font-medium group-hover:text-cyan-300 transition-colors">{cl.lesson.title}</div>
                   <div className="text-xs text-gray-500 uppercase tracking-wider">{cl.lesson.status}</div>
                 </CardContent>
               </Card>
            ))}
            {(classroom.classroomLessons?.length ?? 0) === 0 && (
              <div className="p-8 text-center text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                No lessons assigned to this classroom yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-400" />
              Students
            </h2>
            <span className="text-sm bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full">{classroom.students.length}</span>
          </div>

          <div className="grid gap-2">
            {classroom.students.map((assoc, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                 <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                   {assoc.student.email.charAt(0).toUpperCase()}
                 </div>
                 <div className="text-sm font-medium">{assoc.student.email.split('@')[0]}</div>
              </div>
            ))}
             {classroom.students.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                No students enrolled.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
