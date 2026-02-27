import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, 
  Send, 
  Edit2, 
  Trash2, 
  Reply, 
  User,
  GraduationCap,
  Loader2,
  MoreHorizontal
} from 'lucide-react';
import { 
  getComments, 
  addComment, 
  editComment, 
  deleteComment,
  Comment as CommentType
} from '@/services/commentService';

interface CommentThreadProps {
  lessonId: string;
}

export function CommentThread({ lessonId }: CommentThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [lessonId]);

  async function fetchComments() {
    try {
      setLoading(true);
      const data = await getComments(lessonId);
      setComments(data.comments);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      await addComment(lessonId, newComment);
      setNewComment('');
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!replyContent.trim()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      await addComment(lessonId, replyContent, parentId);
      setReplyContent('');
      setReplyingTo(null);
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(commentId: string) {
    if (!editContent.trim()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      await editComment(commentId, editContent);
      setEditingId(null);
      setEditContent('');
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      setSubmitting(true);
      setError(null);
      await deleteComment(commentId);
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(comment: CommentType) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  function startReply(commentId: string) {
    setReplyingTo(commentId);
    setReplyContent('');
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Discussion ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* New Comment Form */}
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ask a question or share your thoughts..."
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !newComment.trim()}
              size="sm"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to ask a question!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4">
                {/* Comment Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      {comment.author.isTeacher ? (
                        <GraduationCap className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {comment.author.email.split('@')[0]}
                        {comment.author.isTeacher && (
                          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            Teacher
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                        {comment.editedAt !== comment.createdAt && ' (edited)'}
                      </p>
                    </div>
                  </div>
                  {user?.id === comment.authorId && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => startEdit(comment)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                {editingId === comment.id ? (
                  <div className="space-y-2 ml-10">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleEdit(comment.id)}
                        disabled={submitting}
                      >
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm ml-10">{comment.content}</p>
                )}

                {/* Reply Button */}
                {!editingId && (
                  <div className="ml-10 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => startReply(comment.id)}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="ml-10 mt-3 space-y-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleReply(comment.id)}
                        disabled={submitting || !replyContent.trim()}
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Reply
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-10 mt-4 space-y-3 border-l-2 border-primary/20 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                              {reply.author.isTeacher ? (
                                <GraduationCap className="h-3 w-3 text-primary" />
                              ) : (
                                <User className="h-3 w-3 text-primary" />
                              )}
                            </div>
                            <p className="font-medium text-xs">
                              {reply.author.email.split('@')[0]}
                              {reply.author.isTeacher && (
                                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                  Teacher
                                </span>
                              )}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          {user?.id === reply.authorId && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-500"
                              onClick={() => handleDelete(reply.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm ml-8">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
