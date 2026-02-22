import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Save, 
  Upload, 
  FileText, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus,
  Download,
  Upload as UploadIcon,
  Link,
  Unlink,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { GlassCard, GlowButton } from './ParallaxLayout';
import { Article, ArticleCategory, CreateArticleData } from '@/services/articleService';

interface ArticleEditorProps {
  article?: Article;
  onSave: (data: CreateArticleData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onPublish?: (publish: boolean) => Promise<void>;
  isLoading?: boolean;
}

const CATEGORIES: ArticleCategory[] = [
  'MATH', 'SCIENCE', 'LITERATURE', 'HISTORY', 
  'COMPUTER_SCIENCE', 'ARTS', 'LANGUAGES', 'GENERAL'
];

export function ArticleEditor({ 
  article, 
  onSave, 
  onDelete, 
  onPublish,
  isLoading = false 
}: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.content || '');
  const [excerpt, setExcerpt] = useState(article?.excerpt || '');
  const [category, setCategory] = useState<ArticleCategory>(article?.category || 'GENERAL');
  const [tags, setTags] = useState<string[]>(article?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [published, setPublished] = useState(article?.published || false);
  const [activeTab, setActiveTab] = useState('edit');
  const [previewContent, setPreviewContent] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Insert hyperlink at cursor position
  const insertLink = useCallback(() => {
    if (!linkUrl || !linkText) return;
    
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${linkText}</a>`;
    
    // Insert at cursor position or at end
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
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

  // Insert formatting tags
  const insertFormatting = useCallback((before: string, after: string, placeholder: string) => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
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
    const data: CreateArticleData = {
      title,
      content,
      excerpt: excerpt || undefined,
      category,
      tags,
      ...(!asDraft && { published: true }),
    };
    await onSave(data);
  }, [title, content, excerpt, category, tags, onSave]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleExport = () => {
    const draftData = {
      article: {
        title,
        content,
        excerpt,
        category,
        tags,
        status: 'draft'
      }
    };
    const blob = new Blob([JSON.stringify(draftData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `article-${title.toLowerCase().replace(/\s+/g, '-')}.json`;
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
        if (data.article) {
          setTitle(data.article.title || '');
          setContent(data.article.content || '');
          setExcerpt(data.article.excerpt || '');
          setCategory(data.article.category || 'GENERAL');
          setTags(data.article.tags || []);
        }
      } catch (error) {
        console.error('Failed to parse imported file:', error);
      }
    };
    reader.readAsText(file);
  };

  const generatePreview = () => {
    const text = content.replace(/<[^>]*>/g, '');
    const preview = text.slice(0, 300) + (text.length > 300 ? '...' : '');
    setPreviewContent(preview);
    setActiveTab('preview');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {article ? 'Edit Article' : 'Create Article'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {article ? 'Update your article content' : 'Write a new article for your students'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={published ? 'default' : 'secondary'} className="text-sm px-3 py-1">
            {published ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter article title"
                  className="aero-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the article (optional)"
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('<strong>', '</strong>', 'bold text')}
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('<em>', '</em>', 'italic text')}
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('<h1>', '</h1>', 'Heading 1')}
                        title="Heading 1"
                      >
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('<h2>', '</h2>', 'Heading 2')}
                        title="Heading 2"
                      >
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('<h3>', '</h3>', 'Heading 3')}
                        title="Heading 3"
                      >
                        <Heading3 className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>', 'list item')}
                        title="Bullet List"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('<ol>\n  <li>', '</li>\n</ol>', 'list item')}
                        title="Numbered List"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('<blockquote>', '</blockquote>', 'quote')}
                        title="Quote"
                      >
                        <Quote className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertFormatting('<code>', '</code>', 'code')}
                        title="Code"
                      >
                        <Code className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLinkDialogOpen(true)}
                        title="Insert Link"
                        className="text-blue-600"
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Textarea
                      name="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`Write your article content here...

You can use HTML tags for formatting:
- <strong>bold</strong>
- <em>italic</em>
- <h1>Headings</h1>
- <a href="https://example.com">links</a>
- <ul><li>lists</li></ul>

Use the toolbar above for quick formatting!`}
                      className="aero-input min-h-[400px] font-mono"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-4">
                    <div className="prose prose-green dark:prose-invert max-w-none p-4 rounded-lg bg-muted/30 min-h-[400px]">
                      <h2 className="text-xl font-bold">{title}</h2>
                      {excerpt && <p className="text-muted-foreground italic mt-2">{excerpt}</p>}
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

              {article && onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={onDelete}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Article
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Settings */}
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ArticleCategory)}>
                  <SelectTrigger className="aero-input mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
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
                <div className="flex gap-2 mt-2">
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
              Add a clickable link to your article
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
              <p className="text-xs text-muted-foreground mt-1">
                Use full URLs (https://...) for external links or /path for internal links
              </p>
            </div>
            {/* Preview */}
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
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
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

export default ArticleEditor;
