import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, MessageSquare, Lock, Reply, Trash2,
    Send, Clock, MoreVertical, Flag, ShieldCheck,
    CheckCircle2, Loader2, X
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
    id: string;
    content: string;
    isDeleted: boolean;
    author: { id: string; email: string; role: string };
    replies: Post[];
    createdAt: string;
}

interface Thread {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    locked: boolean;
    forumType: string;
    author: { id: string; email: string; role: string };
    posts: Post[];
    createdAt: string;
}

export default function ForumThreadPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const bottomRef = useRef<HTMLDivElement>(null);

    const [thread, setThread] = useState<Thread | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reply, setReply] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null); // parentId
    const [posting, setPosting] = useState(false);

    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
    };

    useEffect(() => { fetchThread(); window.scrollTo(0, 0); }, [id]);

    async function fetchThread() {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/forum/threads/${id}`, { headers });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            setThread(data.thread);
        } catch {
            setError('Nu s-a putut încărca discuția.');
        } finally {
            setLoading(false);
        }
    }

    async function handlePost() {
        if (!reply.trim() || !id) return;
        setPosting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/forum/threads/${id}/posts`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ content: reply, parentId: replyingTo })
            });
            if (res.ok) {
                setReply('');
                setReplyingTo(null);
                await fetchThread();
                // Wait for state update then scroll
                setTimeout(() => {
                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } finally {
            setPosting(false);
        }
    }

    async function handleDelete(postId: string) {
        if (!confirm('Ești sigur că vrei să ștergi această postare?')) return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/forum/posts/${postId}`, {
                method: 'DELETE', headers
            });
            fetchThread();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    }

    const formatDate = (s: string) => new Date(s).toLocaleString('ro-RO', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    const roleStyles = (role: string) => {
        if (role === 'TEACHER') return "from-teal-500 to-emerald-500";
        if (role === 'ADMIN') return "from-red-500 to-rose-600";
        return "from-sky-400 to-indigo-500";
    };

    const roleBadge = (role: string) => {
        if (role === 'TEACHER') return <Badge className="text-[10px] bg-teal-500/10 text-teal-600 border-teal-500/20 py-0 px-2 flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> Profesor</Badge>;
        if (role === 'ADMIN') return <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 py-0 px-2 flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> Admin</Badge>;
        return null;
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
            <span className="text-muted-foreground text-sm font-medium animate-pulse">Se încarcă discuția...</span>
        </div>
    );

    if (error || !thread) return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-6 p-4 text-center">
            <div className="bg-destructive/10 p-4 rounded-full">
                <Lock className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold">Acces restricționat</h3>
                <p className="text-muted-foreground max-w-xs">{error || 'Nu am găsit această discuție sau nu ai permisiunea de a o vizualiza.'}</p>
            </div>
            <Button variant="outline" className="rounded-full px-8" onClick={() => navigate('/forum')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Înapoi la Forum
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pt-20">
            <div className="border-b bg-card/50 backdrop-blur-md sticky top-16 z-20">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-lg leading-tight truncate">{thread.title}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                                {thread.forumType === 'TEACHERS' ? '⚡ Profesor' : '🌱 Elev'}
                            </span>
                            <span className="text-[10px] text-muted-foreground opacity-50 flex items-center gap-1">
                                • <Clock className="h-2.5 w-2.5" /> {formatDate(thread.createdAt)}
                            </span>
                        </div>
                    </div>
                    {thread.locked && <Badge variant="secondary" className="rounded-full"><Lock className="h-3 w-3 mr-1" />ÎNCHIS</Badge>}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 pb-32 space-y-8">
                {/* Original post */}
                <div className="aero-glass p-8 rounded-[2.5rem] border-l-8 border-primary relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Flag className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-destructive" />
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${roleStyles(thread.author.role)} flex items-center justify-center text-white text-lg font-black shadow-lg`}>
                            {thread.author.email[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-base leading-none mb-1">{thread.author.email.split('@')[0]}</span>
                            {roleBadge(thread.author.role)}
                        </div>
                        <div className="ml-auto text-center px-4 py-2 bg-muted/30 rounded-2xl border border-border/20">
                            <span className="block text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">DATA</span>
                            <span className="block text-xs font-bold leading-none">{formatDate(thread.createdAt).split(',')[0]}</span>
                        </div>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground italic font-serif">
                            "{thread.body}"
                        </p>
                    </div>
                </div>

                {/* Separator */}
                <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5" /> {thread.posts.length} {thread.posts.length === 1 ? 'Răspuns' : 'Răspunsuri'}
                    </p>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>

                {/* Posts list */}
                {thread.posts.length > 0 && (
                    <div className="space-y-6">
                        {thread.posts.map(post => (
                            <div key={post.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className={`aero-glass p-6 rounded-3xl relative ${post.isDeleted ? 'opacity-40 grayscale-[0.5]' : ''} border border-border/30 hover:border-primary/20 transition-all`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleStyles(post.author.role)} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                                            {post.author.email[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm leading-none mb-1">{post.author.email.split('@')[0]}</span>
                                            {roleBadge(post.author.role)}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground ml-auto opacity-70">{formatDate(post.createdAt)}</span>
                                        <div className="flex gap-1 ml-2">
                                            {!thread.locked && !post.isDeleted && (
                                                <Button variant="ghost" size="icon" onClick={() => setReplyingTo(post.id)} className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary">
                                                    <Reply className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                                                        <MoreVertical className="h-3.5 w-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl aero-glass">
                                                    {!post.isDeleted && <DropdownMenuItem className="text-xs font-medium"><Flag className="h-3 w-3 mr-2" /> Raportează</DropdownMenuItem>}
                                                    {(user?.id === post.author.id || user?.role === 'ADMIN') && !post.isDeleted && (
                                                        <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-xs font-medium text-destructive focus:text-destructive">
                                                            <Trash2 className="h-3 w-3 mr-2" /> Șterge postarea
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 pl-1">
                                        {post.isDeleted ? <span className="italic flex items-center gap-1 opacity-50"><X size={12} /> Postare ștearsă</span> : post.content}
                                    </p>
                                </div>

                                {/* Nested replies */}
                                {post.replies.length > 0 && (
                                    <div className="ml-10 mt-3 space-y-3 border-l-2 border-primary/20 pl-6">
                                        {post.replies.map(rep => (
                                            <div key={rep.id} className={`aero-glass p-4 rounded-2xl relative ${rep.isDeleted ? 'opacity-40 grayscale-[0.5]' : ''} border border-border/20`}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${roleStyles(rep.author.role)} flex items-center justify-center text-white text-[10px] font-black shadow-sm`}>
                                                        {rep.author.email[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold leading-none mb-0.5">{rep.author.email.split('@')[0]}</span>
                                                        {roleBadge(rep.author.role)}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground ml-auto opacity-60">{formatDate(rep.createdAt)}</span>
                                                    {(user?.id === rep.author.id || user?.role === 'ADMIN') && !rep.isDeleted && (
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rep.id)} className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive">
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <p className="text-xs leading-relaxed whitespace-pre-wrap pl-1">
                                                    {rep.isDeleted ? <span className="italic opacity-50">Răspuns șters</span> : rep.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div ref={bottomRef} className="h-10" />

                {/* Reply box sticky footer */}
                <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/60 backdrop-blur-xl z-30">
                    <div className="max-w-3xl mx-auto">
                        {!thread.locked ? (
                            <div className="relative group">
                                {replyingTo && (
                                    <div className="absolute -top-10 left-0 right-0 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-white bg-primary px-4 py-1.5 rounded-t-xl border-x border-t border-primary/20 shadow-lg">
                                            <span className="flex items-center gap-1.5"><Reply className="h-3 w-3" /> RESPUNZI LA UN COMENTARIU</span>
                                            <button onClick={() => setReplyingTo(null)} className="hover:scale-110 active:scale-90 transition-transform">✕</button>
                                        </div>
                                    </div>
                                )}

                                <div className={`flex gap-3 items-end bg-background border rounded-3xl p-2 pl-4 transition-all duration-300 ${replyingTo ? 'rounded-tl-none border-primary ring-4 ring-primary/5' : 'focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5'}`}>
                                    <textarea
                                        placeholder="Scrie mesajul tău..."
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        className="flex-1 min-h-[44px] max-h-[160px] py-2 bg-transparent border-none text-sm resize-none focus:outline-none scrollbar-none"
                                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handlePost(); }}
                                    />
                                    <Button
                                        size="icon"
                                        onClick={handlePost}
                                        disabled={posting || !reply.trim()}
                                        className="h-10 w-10 shrink-0 rounded-full aero-shadow"
                                    >
                                        {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 text-center font-medium opacity-50">
                                    Apasă <kbd className="bg-muted px-1 rounded border shadow-sm">Ctrl + Enter</kbd> pentru trimitere rapidă
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 rounded-2xl flex items-center justify-center gap-2">
                                <Lock className="h-3.5 w-3.5" /> Discuția a fost închisă de un moderator
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
