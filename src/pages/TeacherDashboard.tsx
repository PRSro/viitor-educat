/**
 * Teacher Dashboard
 * 
 * Full CRUD functionality for lessons with input sanitization:
 * - List all lessons
 * - Create new lesson
 * - Edit existing lesson
 * - Delete lesson
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Lesson,
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
} from '@/services/lessonService';
import { sanitizeInput, containsXssPatterns } from '@/lib/sanitize';
import { lessonSchema, getFirstError } from '@/lib/validation';
import { SafeText } from '@/components/SafeHtml';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch lessons on mount
  useEffect(() => {
    fetchLessons();
  }, []);

  async function fetchLessons() {
    try {
      setLoading(true);
      const data = await getLessons();
      setLessons(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setContent('');
    setIsEditing(false);
    setEditingId(null);
    setFormError(null);
  }

  function handleEdit(lesson: Lesson) {
    setTitle(lesson.title);
    setDescription(lesson.description || '');
    setContent(lesson.content);
    setIsEditing(true);
    setEditingId(lesson.id);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title, 200);
    const sanitizedDescription = sanitizeInput(description, 500);
    const sanitizedContent = sanitizeInput(content, 50000);

    // Check for XSS patterns
    if (containsXssPatterns(sanitizedTitle) || containsXssPatterns(sanitizedContent)) {
      setFormError('Input contains invalid characters');
      return;
    }

    // Validate with schema
    const validationErr = getFirstError(lessonSchema, {
      title: sanitizedTitle,
      description: sanitizedDescription || undefined,
      content: sanitizedContent,
    });
    if (validationErr) {
      setFormError(validationErr);
      return;
    }

    try {
      setSaving(true);
      if (isEditing && editingId) {
        await updateLesson(editingId, { 
          title: sanitizedTitle, 
          description: sanitizedDescription, 
          content: sanitizedContent 
        });
      } else {
        await createLesson({ 
          title: sanitizedTitle, 
          description: sanitizedDescription, 
          content: sanitizedContent 
        });
      }
      resetForm();
      await fetchLessons();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await deleteLesson(id);
      await fetchLessons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson');
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">
              Logged in as: {user?.email} ({user?.role})
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Lesson Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Edit Lesson' : 'Create New Lesson'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Lesson title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Lesson content"
                  rows={5}
                />
              </div>
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : isEditing ? 'Update Lesson' : 'Create Lesson'}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lessons List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading lessons...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : lessons.length === 0 ? (
              <p className="text-muted-foreground">No lessons yet. Create your first lesson above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium">
                        <SafeText content={lesson.title} />
                      </TableCell>
                      <TableCell>
                        <SafeText content={lesson.description || '-'} />
                      </TableCell>
                      <TableCell>
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(lesson)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(lesson.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
