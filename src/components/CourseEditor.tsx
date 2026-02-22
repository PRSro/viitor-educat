import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Save,
  Upload,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Download,
  Upload as UploadIcon,
  BookOpen,
  FileText,
  AlertCircle,
  Lock,
  Globe,
  FileStack
} from 'lucide-react';
import { GlassCard } from './ParallaxLayout';
import { Course, CreateCourseData } from '../services/courseService';
import { Lesson, CreateLessonData } from '../services/lessonService';

interface CourseEditorProps {
  course?: Course;
  lessons?: Lesson[];
  onSaveCourse: (data: CreateCourseData & { published?: boolean }) => Promise<Course>;
  onDeleteCourse?: () => Promise<void>;
  onPublish?: (publish: boolean) => Promise<void>;
  onCreateLesson?: (data: CreateLessonData) => Promise<Lesson>;
  onUpdateLesson?: (id: string, data: Partial<CreateLessonData>) => Promise<Lesson>;
  onDeleteLesson?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const COURSE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

export function CourseEditor({
  course,
  lessons = [],
  onSaveCourse,
  onDeleteCourse,
  onPublish,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  isLoading = false
}: CourseEditorProps) {
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [imageUrl, setImageUrl] = useState(course?.imageUrl || '');
  const [level, setLevel] = useState<string>(course?.level || 'BEGINNER');
  const [category, setCategory] = useState(course?.category || 'GENERAL');
  const [tags, setTags] = useState<string[]>(course?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [published, setPublished] = useState(!!course?.published);
  const [status, setStatus] = useState<'DRAFT' | 'PRIVATE' | 'PUBLIC'>(course?.status as any || 'DRAFT');
  const [lessonList, setLessonList] = useState<Lesson[]>(lessons);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [canPublish, setCanPublish] = useState(lessons.length > 0);

  useEffect(() => {
    setLessonList(lessons);
    setCanPublish(lessons.length > 0);
  }, [lessons]);

  const handleSaveCourse = useCallback(async (asDraft: boolean = true) => {
    const data: CreateCourseData & { published?: boolean } = {
      title,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      level: level as any,
      category,
      tags,
      status: status,
    };
    if (!asDraft) {
      data.published = true;
    }
    await onSaveCourse(data);
  }, [title, description, imageUrl, level, category, tags, status, onSaveCourse]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleCreateLesson = async () => {
    if (!newLessonTitle.trim() || !onCreateLesson || !course?.id) return;

    const lessonData: CreateLessonData = {
      title: newLessonTitle,
      content: '',
      courseId: course.id,
      order: lessonList.length,
    };

    const newLesson = await onCreateLesson(lessonData);
    setLessonList([...lessonList, newLesson]);
    setNewLessonTitle('');
    setShowNewLesson(false);
    setCanPublish(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!onDeleteLesson) return;
    await onDeleteLesson(lessonId);
    const updated = lessonList.filter(l => l.id !== lessonId);
    setLessonList(updated);
    setCanPublish(updated.length > 0);
  };

  const handleExport = () => {
    const draftData = {
      course: {
        title,
        description,
        imageUrl,
        level,
        category,
        tags,
        status: 'draft'
      },
      lessons: lessonList.map(l => ({
        title: l.title,
        description: l.description,
        content: l.content,
        order: l.order,
        status: l.status
      }))
    };
    const blob = new Blob([JSON.stringify(draftData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-${title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.course) {
          setTitle(data.course.title || '');
          setDescription(data.course.description || '');
          setImageUrl(data.course.imageUrl || '');
          setLevel(data.course.level || 'BEGINNER');
          setCategory(data.course.category || 'GENERAL');
          setTags(data.course.tags || []);
        }
      } catch (error) {
        console.error('Failed to parse imported file:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            {course ? 'Edit Course' : 'Create Course'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {course ? 'Update your course details and lessons' : 'Create a new course for your students'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={status === 'PUBLIC' ? 'default' : status === 'PRIVATE' ? 'secondary' : 'outline'} className="text-sm px-3 py-1">
            {status === 'PUBLIC' && <Globe className="w-3 h-3 mr-1" />}
            {status === 'PRIVATE' && <Lock className="w-3 h-3 mr-1" />}
            {status === 'DRAFT' && <FileStack className="w-3 h-3 mr-1" />}
            {status}
          </Badge>
          <Select value={status} onValueChange={(v: 'DRAFT' | 'PRIVATE' | 'PUBLIC') => setStatus(v)}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="PUBLIC">Public</SelectItem>
            </SelectContent>
          </Select>
          {course && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              {lessonList.length} Lesson{lessonList.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Publish Warning */}
      {!canPublish && published && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Course cannot be published</p>
          </div>
          <p className="text-amber-700 dark:text-amber-300 mt-1 text-sm">
            Add at least one lesson before publishing this course.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-4">Course Details</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter course title"
                  className="aero-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what students will learn"
                  className="aero-input mt-1"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Level</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="aero-input mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l.charAt(0) + l.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Category</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Programming"
                    className="aero-input mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Image URL</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="aero-input mt-1"
                />
              </div>
            </div>
          </GlassCard>

          {/* Lessons Section */}
          {course && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Lessons
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewLesson(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lesson
                </Button>
              </div>

              {/* New Lesson Form */}
              {showNewLesson && (
                <div className="mb-4 p-4 rounded-lg bg-muted/30">
                  <Input
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder="Lesson title"
                    className="aero-input mb-3"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateLesson} disabled={!newLessonTitle.trim()}>
                      Create
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewLesson(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Lessons List */}
              {lessonList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No lessons yet. Add your first lesson!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessonList.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{lesson.title}</p>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground">{lesson.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={lesson.status === 'public' ? 'default' : 'secondary'}>
                          {lesson.status || 'draft'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={() => handleSaveCourse(true)}
                disabled={isLoading || !title}
                className="w-full aero-button-accent"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>

              {onPublish && (
                <Button
                  onClick={() => handleSaveCourse(false)}
                  disabled={isLoading || !title || !canPublish}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {published ? 'Update Published' : 'Publish'}
                </Button>
              )}

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full">
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Import Draft
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={handleExport}
                disabled={!title}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Draft
              </Button>

              {course && onDeleteCourse && (
                <Button
                  variant="destructive"
                  onClick={onDeleteCourse}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Course
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Tags */}
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag"
                className="aero-input"
              />
              <Button variant="outline" size="icon" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default CourseEditor;
