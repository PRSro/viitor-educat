/**
 * Student Dashboard
 * 
 * Read-only access to lessons:
 * - List all lessons
 * - View lesson details
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Lesson, getLessons, getLesson } from '@/services/lessonService';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Viewing lesson details
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);

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

  async function handleViewLesson(id: string) {
    try {
      setLoadingLesson(true);
      const lesson = await getLesson(id);
      setSelectedLesson(lesson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lesson');
    } finally {
      setLoadingLesson(false);
    }
  }

  function closeDetails() {
    setSelectedLesson(null);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-muted-foreground">
              Logged in as: {user?.email} ({user?.role})
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {/* Lesson Details Modal/Card */}
        {selectedLesson && (
          <Card className="mb-8 border-2 border-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedLesson.title}</CardTitle>
                  <CardDescription>
                    By: {selectedLesson.teacher.email} | 
                    Created: {new Date(selectedLesson.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={closeDetails}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedLesson.description && (
                <p className="text-muted-foreground mb-4">{selectedLesson.description}</p>
              )}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Content:</h4>
                <p className="whitespace-pre-wrap">{selectedLesson.content}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lessons List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Lessons</CardTitle>
            <CardDescription>
              Click "View" to see lesson details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading lessons...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : lessons.length === 0 ? (
              <p className="text-muted-foreground">No lessons available yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium">{lesson.title}</TableCell>
                      <TableCell>{lesson.description || '-'}</TableCell>
                      <TableCell>{lesson.teacher.email}</TableCell>
                      <TableCell>
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewLesson(lesson.id)}
                          disabled={loadingLesson}
                        >
                          {loadingLesson ? 'Loading...' : 'View'}
                        </Button>
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
