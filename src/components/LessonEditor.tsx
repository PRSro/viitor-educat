import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  Upload, 
  Eye, 
  Edit3, 
  Trash2, 
  Download,
  Upload as UploadIcon,
  FileText,
  ArrowLeft,
  ArrowRight,
  Link,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Lock,
  Globe,
  FileStack
} from 'lucide-react';
import { GlassCard } from './ParallaxLayout';
import { Lesson, CreateLessonData, UpdateLessonData } from '@/services/lessonService';

interface LessonEditorProps {
  lesson?: Lesson;
  courseId: string;
  onSave: (data: CreateLessonData | UpdateLessonData) => Promise<Lesson>;
  onDelete?: () => Promise<void>;
  onPublish?: (publish: boolean) => Promise<void>;
  onViewCourse?: () => void;
  isLoading?: boolean;
}

export function LessonEditor({ 
  lesson, 
  courseId,
  onSave, 
  onDelete, 
  onPublish,
  onViewCourse,
  isLoading = false 
}: LessonEditorProps) {
  const [title, setTitle] = useState(lesson?.title || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [content, setContent] = useState(lesson?.content || '');
  const [order, setOrder] = useState(lesson?.order || 0);
  const [status, setStatus] = useState<'DRAFT' | 'PRIVATE' | 'PUBLIC'>(lesson?.status as any || 'DRAFT');
  const [activeTab, setActiveTab] = useState('edit');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const insertLink = useCallback(() => {
    if (!linkUrl || !linkText) return;
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${linkText}</a>`;
    const textarea = document.querySelector('textarea[name="lessonContent"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = content.substring(0, start);
      const after = content.substring(end);
      setContent(before + linkHtml + after);
    } else {
      setContent(content + linkHtml);
    }
    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  }, [linkUrl, linkText, content]);

  const insertFormatting = useCallback((before: string, after: string, placeholder: string) => {
    const textarea = document.querySelector('textarea[name="lessonContent"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end) || placeholder;
      const beforeText = content.substring(0, start);
      const afterText = content.substring(end);
      setContent(beforeText + before + selectedText + after + afterText);
    } else {
      setContent(content + before + placeholder + after);
    }
  }, [content]);

  const handleSave = useCallback(async (asDraft: boolean = true) => {
    const data: CreateLessonData | UpdateLessonData = {
      title,
      content,
      description: description || undefined,
      order,
      status: status,
    };
    await onSave(data);
  }, [title, content, description, order, status, onSave]);

  const handleExport = () => {
    const draftData = {
      lesson: {
        title,
        description,
        content,
        order,
        status: 'draft'
      }
    };
    const blob = new Blob([JSON.stringify(draftData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-${title.toLowerCase().replace(/\s+/g, '-')}.json`;
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
        if (data.lesson) {
          setTitle(data.lesson.title || '');
          setDescription(data.lesson.description || '');
          setContent(data.lesson.content || '');
          setOrder(data.lesson.order || 0);
        }
      } catch (error) {
        console.error('Failed to parse imported file:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            {onViewCourse && (
              <Button variant="ghost" size="sm" onClick={onViewCourse}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Button>
            )}
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            {lesson ? 'Edit Lesson' : 'Create Lesson'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lesson ? 'Update your lesson content' : 'Add a new lesson to your course'}
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter lesson title"
                  className="aero-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this lesson covers"
                  className="aero-input mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label>Content</Label>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-1">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit" className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit" className="mt-4">
                    {/* Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 mb-2 p-2 bg-muted/30 rounded-lg">
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<strong>', '</strong>', 'bold')} title="Bold">
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<em>', '</em>', 'italic')} title="Italic">
                        <Italic className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<h1>', '</h1>', 'Heading 1')} title="Heading 1">
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<h2>', '</h2>', 'Heading 2')} title="Heading 2">
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<h3>', '</h3>', 'Heading 3')} title="Heading 3">
                        <Heading3 className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>', 'item')} title="Bullet List">
                        <List className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<ol>\n  <li>', '</li>\n</ol>', 'item')} title="Numbered List">
                        <ListOrdered className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<blockquote>', '</blockquote>', 'quote')} title="Quote">
                        <Quote className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting('<code>', '</code>', 'code')} title="Code">
                        <Code className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setLinkDialogOpen(true)} title="Insert Link" className="text-blue-600">
                        <Link className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Textarea
                      name="lessonContent"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`Write your lesson content here...

You can use HTML tags:
- <strong>bold</strong>
- <em>italic</em>
- <h1>Headings</h1>
- <a href="url">links</a>
- <ul><li>lists</li></ul>`}
                      className="aero-input min-h-[400px] font-mono"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-4">
                    <div className="prose prose-green dark:prose-invert max-w-none p-4 rounded-lg bg-muted/30 min-h-[400px]">
                      <h2 className="text-xl font-bold">{title}</h2>
                      {description && <p className="text-muted-foreground italic mt-2">{description}</p>}
                      <div 
                        className="mt-4"
                        dangerouslySetInnerHTML={{ __html: content }}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => handleSave(true)} 
                disabled={isLoading || !title || !content}
                className="w-full aero-button-accent"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              
              {onPublish && (
                <Button 
                  onClick={() => handleSave(false)} 
                  disabled={isLoading || !title || !content}
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

              {lesson && onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={onDelete}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Lesson
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Settings */}
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                  min={0}
                  className="aero-input mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Position in course (0 = first)
                </p>
              </div>

              {onPublish && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="published">Published</Label>
                  <Switch
                    id="published"
                    checked={published}
                    onCheckedChange={setPublished}
                  />
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Link Insertion Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Hyperlink</DialogTitle>
            <DialogDescription>
              Add a clickable link to your lesson
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="linkText">Link Text</Label>
              <Input
                id="linkText"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Text to display"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com or /courses/my-course"
                className="mt-1"
              />
            </div>
            {linkText && linkUrl && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                  {linkText}
                </a>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={insertLink} disabled={!linkText || !linkUrl}>
              <Link className="w-4 h-4 mr-2" />
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LessonEditor;
