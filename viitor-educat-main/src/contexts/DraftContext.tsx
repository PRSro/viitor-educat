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

interface LessonDraft {
  id: string;
  title: string;
  description?: string;
  content: string;
  order: number;
  status: 'draft';
  updatedAt: string;
}

interface DraftContextType {
  articleDrafts: ArticleDraft[];
  lessonDrafts: LessonDraft[]; // Changed courseDrafts to lessonDrafts
  saveArticleDraft: (draft: Omit<ArticleDraft, 'id' | 'updatedAt' | 'status'>) => void;
  saveLessonDraft: (draft: Omit<LessonDraft, 'id' | 'updatedAt' | 'status'>) => void; // Changed saveCourseDraft to saveLessonDraft
  deleteArticleDraft: (id: string) => void;
  deleteLessonDraft: (id: string) => void; // Changed deleteCourseDraft to deleteLessonDraft
  getArticleDraft: (id: string) => ArticleDraft | undefined;
  getLessonDraft: (id: string) => LessonDraft | undefined; // Changed getCourseDraft to getLessonDraft
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

const STORAGE_KEYS = {
  articles: 'viitor_educat_article_drafts',
  lessons: 'viitor_educat_lesson_drafts', // Changed courses to lessons
};

export function DraftProvider({ children }: { children: ReactNode }) {
  const [articleDrafts, setArticleDrafts] = useState<ArticleDraft[]>([]);
  const [lessonDrafts, setLessonDrafts] = useState<LessonDraft[]>([]); // Changed courseDrafts to lessonDrafts

  useEffect(() => {
    const storedArticles = localStorage.getItem(STORAGE_KEYS.articles);
    const storedLessons = localStorage.getItem(STORAGE_KEYS.lessons);

    if (storedArticles) {
      try {
        setArticleDrafts(JSON.parse(storedArticles));
      } catch (e) {
        console.error('Failed to parse article drafts:', e);
      }
    }

    if (storedLessons) {
      try {
        setLessonDrafts(JSON.parse(storedLessons));
      } catch (e) {
        console.error('Failed to parse lesson drafts:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(articleDrafts));
  }, [articleDrafts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.lessons, JSON.stringify(lessonDrafts));
  }, [lessonDrafts]);

  const saveArticleDraft = (draft: Omit<ArticleDraft, 'id' | 'updatedAt' | 'status'>) => {
    const newDraft: ArticleDraft = {
      ...draft,
      id: crypto.randomUUID(),
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    setArticleDrafts(prev => [...prev, newDraft]);
  };

  const saveLessonDraft = (draft: Omit<LessonDraft, 'id' | 'updatedAt' | 'status'>) => {
    const newDraft: LessonDraft = {
      ...draft,
      id: crypto.randomUUID(),
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    setLessonDrafts(prev => [...prev, newDraft]);
  };

  const deleteArticleDraft = (id: string) => {
    setArticleDrafts(prev => prev.filter(d => d.id !== id));
  };

  const deleteLessonDraft = (id: string) => {
    setLessonDrafts(prev => prev.filter(d => d.id !== id));
  };

  const getArticleDraft = (id: string) => {
    return articleDrafts.find(d => d.id === id);
  };

  const getLessonDraft = (id: string) => {
    return lessonDrafts.find(d => d.id === id);
  };

  return (
    <DraftContext.Provider value={{
      articleDrafts,
      lessonDrafts,
      saveArticleDraft,
      saveLessonDraft,
      deleteArticleDraft,
      deleteLessonDraft,
      getArticleDraft,
      getLessonDraft,
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
