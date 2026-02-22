import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ArticleDraft {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  status: 'draft';
  updatedAt: string;
}

interface CourseDraft {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  level: string;
  category: string;
  tags: string[];
  lessons: LessonDraft[];
  status: 'draft';
  updatedAt: string;
}

interface LessonDraft {
  id: string;
  title: string;
  description?: string;
  content: string;
  order: number;
  status: 'draft';
}

interface DraftContextType {
  articleDrafts: ArticleDraft[];
  courseDrafts: CourseDraft[];
  saveArticleDraft: (draft: Omit<ArticleDraft, 'id' | 'updatedAt' | 'status'>) => void;
  saveCourseDraft: (draft: Omit<CourseDraft, 'id' | 'updatedAt' | 'status'>) => void;
  deleteArticleDraft: (id: string) => void;
  deleteCourseDraft: (id: string) => void;
  getArticleDraft: (id: string) => ArticleDraft | undefined;
  getCourseDraft: (id: string) => CourseDraft | undefined;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

const STORAGE_KEYS = {
  articles: 'viitor_educat_article_drafts',
  courses: 'viitor_educat_course_drafts',
};

export function DraftProvider({ children }: { children: ReactNode }) {
  const [articleDrafts, setArticleDrafts] = useState<ArticleDraft[]>([]);
  const [courseDrafts, setCourseDrafts] = useState<CourseDraft[]>([]);

  useEffect(() => {
    const storedArticles = localStorage.getItem(STORAGE_KEYS.articles);
    const storedCourses = localStorage.getItem(STORAGE_KEYS.courses);

    if (storedArticles) {
      try {
        setArticleDrafts(JSON.parse(storedArticles));
      } catch (e) {
        console.error('Failed to parse article drafts:', e);
      }
    }

    if (storedCourses) {
      try {
        setCourseDrafts(JSON.parse(storedCourses));
      } catch (e) {
        console.error('Failed to parse course drafts:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(articleDrafts));
  }, [articleDrafts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(courseDrafts));
  }, [courseDrafts]);

  const saveArticleDraft = (draft: Omit<ArticleDraft, 'id' | 'updatedAt' | 'status'>) => {
    const newDraft: ArticleDraft = {
      ...draft,
      id: crypto.randomUUID(),
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    setArticleDrafts(prev => [...prev, newDraft]);
  };

  const saveCourseDraft = (draft: Omit<CourseDraft, 'id' | 'updatedAt' | 'status'>) => {
    const newDraft: CourseDraft = {
      ...draft,
      id: crypto.randomUUID(),
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    setCourseDrafts(prev => [...prev, newDraft]);
  };

  const deleteArticleDraft = (id: string) => {
    setArticleDrafts(prev => prev.filter(d => d.id !== id));
  };

  const deleteCourseDraft = (id: string) => {
    setCourseDrafts(prev => prev.filter(d => d.id !== id));
  };

  const getArticleDraft = (id: string) => {
    return articleDrafts.find(d => d.id === id);
  };

  const getCourseDraft = (id: string) => {
    return courseDrafts.find(d => d.id === id);
  };

  return (
    <DraftContext.Provider value={{
      articleDrafts,
      courseDrafts,
      saveArticleDraft,
      saveCourseDraft,
      deleteArticleDraft,
      deleteCourseDraft,
      getArticleDraft,
      getCourseDraft,
    }}>
      {children}
    </DraftContext.Provider>
  );
}

export function useDrafts() {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDrafts must be used within a DraftProvider');
  }
  return context;
}

export default DraftProvider;
