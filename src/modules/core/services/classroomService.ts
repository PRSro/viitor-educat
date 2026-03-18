import { api } from '@/lib/apiClient';

export interface Classroom {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  teacher?: { email: string; id: string };
  _count?: { students: number; classroomLessons: number };
}

export interface ClassroomLesson {
  id: string;
  classroomId: string;
  lessonId: string;
  order: number;
  assignedAt: string;
  lesson: { id: string; title: string; status: string; order: number; description: string | null };
}

export interface ClassroomDetail extends Classroom {
  classroomLessons: ClassroomLesson[];
  students: { student: { email: string; id: string } }[];
}


export const classroomService = {
  getClassrooms: async (): Promise<Classroom[]> => {
    return api.get<Classroom[]>('/classrooms');
  },

  getClassroom: async (id: string): Promise<ClassroomDetail> => {
    return api.get<ClassroomDetail>(`/classrooms/${id}`);
  },

  createClassroom: async (data: { name: string; description?: string }): Promise<Classroom> => {
    return api.post<Classroom>('/classrooms', data);
  },

  joinClassroom: async (joinCode: string): Promise<{ success: boolean; classroom: Classroom }> => {
    return api.post<{ success: boolean; classroom: Classroom }>('/classrooms/join', { joinCode });
  },

  assignLesson: (classroomId: string, lessonId: string) =>
    api.post<any>(`/classrooms/${classroomId}/lessons`, { lessonId }),

  removeLesson: (classroomId: string, lessonId: string) =>
    api.delete<any>(`/classrooms/${classroomId}/lessons/${lessonId}`),
};
