import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, HelpCircle, ChevronRight } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface Question {
  id: string;
  prompt: string;
  questionType: string;
  order: number;
  hint?: string | null;
}

interface TaskBlockProps {
  lessonId: string;
  questions: Question[];
  taskNumber?: number;
}

interface AnswerState {
  value: string;
  submitted: boolean;
  correct: boolean | null;
  correctAnswer?: string;
  hint?: string | null;
  loading: boolean;
}

export function LessonTaskBlock({ lessonId, questions, taskNumber = 1 }: TaskBlockProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(
    Object.fromEntries(questions.map(q => [q.id, {
      value: '', submitted: false, correct: null, loading: false
    }]))
  );

  const submit = async (questionId: string) => {
    const state = answers[questionId];
    if (!state.value.trim() || state.loading) return;

    setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], loading: true } }));

    try {
      const res = await api.post<{
        correct: boolean | null;
        correctAnswer?: string;
        hint?: string | null;
      }>(`/api/lessons/${lessonId}/questions/${questionId}/answer`, {
        answer: state.value.trim(),
      });

      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          submitted: true,
          correct: res.correct,
          correctAnswer: res.correctAnswer,
          hint: res.hint,
          loading: false,
        },
      }));
    } catch {
      setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], loading: false } }));
    }
  };

  const retry = (questionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { value: '', submitted: false, correct: null, loading: false },
    }));
  };

  return (
    <div className="my-6 aero-glass rounded-2xl overflow-hidden border border-primary/20">
      {/* Task header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-primary/10 border-b border-primary/20">
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">#{taskNumber}</span>
        </div>
        <span className="text-sm font-semibold">
          {questions.length === 1 ? 'Task Question' : `Task ${taskNumber} — ${questions.length} Questions`}
        </span>
        {questions.every(q => answers[q.id]?.correct) && (
          <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">
            <CheckCircle className="h-3 w-3 mr-1" /> Completed
          </Badge>
        )}
      </div>

      {/* Questions */}
      <div className="divide-y divide-border/40">
        {questions.map((q, i) => {
          const state = answers[q.id];
          return (
            <div key={q.id} className="px-5 py-4 space-y-3">
              <p className="text-sm font-medium flex gap-2 items-start">
                <span className="text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
                <span>{q.prompt}</span>
              </p>

              {!state.submitted ? (
                <div className="flex gap-2">
                  <Input
                    value={state.value}
                    onChange={e => setAnswers(prev => ({
                      ...prev,
                      [q.id]: { ...prev[q.id], value: e.target.value }
                    }))}
                    onKeyDown={e => e.key === 'Enter' && submit(q.id)}
                    placeholder="Your answer..."
                    className="aero-input flex-1 text-sm"
                    disabled={state.loading}
                  />
                  <Button
                    size="sm"
                    className="aero-button-accent gap-1 shrink-0"
                    onClick={() => submit(q.id)}
                    disabled={!state.value.trim() || state.loading}
                  >
                    {state.loading ? '...' : <><ChevronRight className="h-3.5 w-3.5" /> Submit</>}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Result banner */}
                  {state.correct === true && (
                    <div className="flex items-center gap-2 text-primary bg-primary/10 border-primary/20 rounded-lg px-3 py-2 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span className="font-medium">Correct!</span>
                    </div>
                  )}
                  {state.correct === false && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm">
                        <XCircle className="h-4 w-4 shrink-0" />
                        <span>Incorrect. {state.correctAnswer && <>Correct answer: <span className="font-mono font-bold ml-1">{state.correctAnswer}</span></>}</span>
                      </div>
                      {state.hint && (
                        <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-xs">
                          <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                          Hint: {state.hint}
                        </div>
                      )}
                    </div>
                  )}
                  {state.correct === null && (
                    <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>Answer submitted.</span>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => retry(q.id)}>
                    Try again
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
