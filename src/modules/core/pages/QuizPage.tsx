import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/apiClient';

interface Question {
  id: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options: string[];
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  course?: { id: string; title: string; slug: string };
  questions: Question[];
}

interface AttemptResult {
  score: number;
  passed: boolean;
  totalPoints: number;
  earnedPoints: number;
  answers: { questionId: string; correct: boolean; correctAnswer: string }[];
}

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const response = await api.get<{ quiz: Quiz }>(`/quizzes/${quizId}`);
        setQuiz(response.quiz);
      } catch (err) {
        console.error('Failed to fetch quiz:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quizId) return;
    setSubmitting(true);
    try {
      const response = await api.post<AttemptResult>(`/quizzes/${quizId}/attempt`, { answers });
      setResult(response);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = quiz?.questions.every(q => answers[q.id]);

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen py-24 flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold mb-4">Quiz not found</h2>
        <Button asChild>
          <Link to="/student">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="min-h-screen py-24 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <Link to={quiz.course ? `/courses/${quiz.course.slug}` : '/student'}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {quiz.course ? 'Back to Course' : 'Back to Dashboard'}
          </Button>
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            {quiz.description && (
              <p className="text-muted-foreground">{quiz.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                {quiz.questions.length} întrebări
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {totalPoints} puncte
              </span>
              {quiz.timeLimit && (
                <span>{quiz.timeLimit} min</span>
              )}
              <span>Pass: {quiz.passingScore}%</span>
            </div>
          </CardHeader>
        </Card>

        {submitted && result ? (
          <Card className={result.passed ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.passed ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                {result.passed ? 'Felicitări!' : 'Nu ai trecut'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-2">
                  {Math.round((result.earnedPoints / result.totalPoints) * 100)}%
                </div>
                <p className="text-muted-foreground">
                  {result.earnedPoints} / {result.totalPoints} puncte
                </p>
              </div>
              <div className="space-y-3">
                {quiz.questions.map((q, idx) => {
                  const answerResult = result.answers.find(a => a.questionId === q.id);
                  return (
                    <div key={q.id} className={`p-3 rounded-lg ${
                      answerResult?.correct 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <div className="flex items-start gap-2">
                        {answerResult?.correct ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{idx + 1}. {q.question}</p>
                          {!answerResult?.correct && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Răspuns corect: {answerResult?.correctAnswer || q.options[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button asChild className="w-full mt-6">
                <Link to={quiz.course ? `/courses/${quiz.course.slug}` : '/student'}>
                  Înapoi la Curs
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {quiz.questions.map((question, idx) => (
              <Card key={question.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium">
                      {idx + 1}. {question.question}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {question.points} puncte
                    </span>
                  </div>
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    className="space-y-2"
                  >
                    {question.options.map((option, optIdx) => (
                      <div key={optIdx} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option}
                          id={`${question.id}-${optIdx}`}
                          disabled={submitted}
                        />
                        <Label
                          htmlFor={`${question.id}-${optIdx}`}
                          className="cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se trimite...
                </>
              ) : (
                'Trimite Răspunsurile'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
