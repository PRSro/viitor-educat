import { api } from '@/lib/apiClient';
import { API_PATHS } from '@/lib/apiPaths';

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
    return api.get<Classroom[]>(API_PATHS.CLASSROOMS);
  },

  getClassroom: async (id: string): Promise<ClassroomDetail> => {
    return api.get<ClassroomDetail>(API_PATHS.CLASSROOM(id));
  },

  createClassroom: async (data: { name: string; description?: string }): Promise<Classroom> => {
    return api.post<Classroom>(API_PATHS.CLASSROOMS, data);
  },

  joinClassroom: async (joinCode: string): Promise<{ success: boolean; classroom: Classroom }> => {
    return api.post<{ success: boolean; classroom: Classroom }>(API_PATHS.CLASSROOM_JOIN(joinCode), { joinCode });
  },

  assignLesson: (classroomId: string, lessonId: string) =>
    api.post<any>(`${API_PATHS.CLASSROOM(classroomId)}/lessons`, { lessonId }),

  removeLesson: (classroomId: string, lessonId: string) =>
    api.delete<any>(`${API_PATHS.CLASSROOM(classroomId)}/lessons/${lessonId}`),
};
