import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    MessageSquare, Plus, Pin, Lock, Users, GraduationCap,
    ArrowRight, Clock, Search, Loader2
} from 'lucide-react';

interface Thread {
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    locked: boolean;
    forumType: 'GENERAL' | 'TEACHERS';
    author: { id: string; email: string; role: string };
    _count: { posts: number };
    createdAt: string;
    updatedAt: string;
}

export default function ForumPage() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('type') || 'GENERAL') as 'GENERAL' | 'TEACHERS';

    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [showNewThread, setShowNewThread] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newBody, setNewBody] = useState('');
    const [posting, setPosting] = useState(false);

    const canAccessTeachers = user?.role === 'TEACHER' || user?.role === 'ADMIN';

    useEffect(() => {
        fetchThreads();
    }, [activeTab]);

    async function fetchThreads() {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/forum/threads?type=${activeTab}`,
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'ngrok-skip-browser-warning': 'true' } }
            );
            const data = await res.json();
            setThreads(data.threads || []);
            setTotal(data.total || 0);
        } catch {
            setThreads([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateThread() {
        if (!newTitle.trim() || !newBody.trim()) return;
        setPosting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/forum/threads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ title: newTitle, body: newBody, forumType: activeTab })
            });
            if (res.ok) {
                setNewTitle('');
                setNewBody('');
                setShowNewThread(false);
                fetchThreads();
            }
        } finally {
            setPosting(false);
        }
    }

    const filtered = threads.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (s: string) => new Date(s).toLocaleDateString('ro-RO', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    return (
        <div className="min-h-screen bg-background pt-20">
            {/* Header bar */}
            <div className="border-b bg-card/50 backdrop-blur-sm sticky top-16 z-10 transition-all duration-300">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/student" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
                        ← Dashboard
                    </Link>
                    <h1 className="font-bold text-lg flex-1">Forumuri</h1>
                    <Button size="sm" onClick={() => setShowNewThread(!showNewThread)} className="aero-shadow text-white hover:scale-105 active:scale-95 transition-all">
                        <Plus className="h-4 w-4 mr-1" /> Subiect Nou
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Tab switcher */}
                <div className="flex gap-2 mb-6 p-1 aero-glass w-fit rounded-2xl mx-auto sm:mx-0">
                    <button
                        onClick={() => setSearchParams({ type: 'GENERAL' })}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'GENERAL'
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'hover:bg-accent/50'
                            }`}
                    >
                        <Users className="h-4 w-4" /> Forum General
                        <Badge variant="secondary" className="ml-1 bg-white/20 text-foreground border-none">
                            {activeTab === 'GENERAL' ? total : ''}
                        </Badge>
                    </button>

                    {canAccessTeachers && (
                        <button
                            onClick={() => setSearchParams({ type: 'TEACHERS' })}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'TEACHERS'
                                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                                    : 'hover:bg-accent/50'
                                }`}
                        >
                            <GraduationCap className="h-4 w-4" /> Forum Profesori
                            {activeTab === 'TEACHERS' && (
                                <Badge variant="secondary" className="ml-1 bg-white/20 text-white border-none">{total}</Badge>
                            )}
                        </button>
                    )}
                </div>

                {/* Forum description */}
                <div className={`aero-glass p-5 rounded-2xl mb-8 border transition-all ${activeTab === 'TEACHERS' ? 'border-teal-500/30 bg-teal-500/5' : 'border-primary/10 bg-primary/5'
                    }`}>
                    {activeTab === 'GENERAL' ? (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Forum General</strong> — Bine ați venit în spațiul de discuții al elevilor.
                            Aici puteți interacționa cu colegii, cere ajutor pentru cursuri și explora teme de interes general.
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Forum Profesori</strong> — Acesta este un spațiu privat dedicat cadrelor didactice
                            pentru coordonarea activităților academice și schimbul de experiențe pedagogice.
                            <Lock className="h-3 w-3 inline ml-1 text-teal-500" />
                        </p>
                    )}
                </div>

                {/* New thread form */}
                {showNewThread && (
                    <div className="aero-glass p-6 rounded-2xl mb-8 border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h3 className="font-semibold mb-4 text-lg">Creează o discuție nouă</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground ml-1">TITLU</label>
                                <Input
                                    placeholder="Despre ce dorești să vorbim?"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="bg-background/50 border-border/50 focus:border-primary/50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground ml-1">CONȚINUT</label>
                                <textarea
                                    placeholder="Scrie corpul mesajului aici..."
                                    value={newBody}
                                    onChange={e => setNewBody(e.target.value)}
                                    className="w-full min-h-[150px] p-4 rounded-xl bg-background/50 border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <Button variant="ghost" size="sm" onClick={() => setShowNewThread(false)}>Anulează</Button>
                                <Button size="sm" onClick={handleCreateThread} disabled={posting || !newTitle.trim() || !newBody.trim()} className="px-6">
                                    {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {posting ? 'Se postează...' : 'Postează'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search & Statistics */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Caută în discuții..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 aero-glass-input"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 px-4 py-2 rounded-xl">
                        <MessageSquare className="h-3 w-3" /> {total} Subiecte
                    </div>
                </div>

                {/* Thread list */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                        <p className="text-sm animate-pulse">Se încarcă discuțiile...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 aero-glass border-dashed rounded-3xl border-2 border-border/50">
                        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageSquare className="h-10 w-10 text-primary-foreground/50" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Nicio discuție găsită</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                            Nu am găsit subiecte care să corespundă căutării tale sau nu există încă discuții în acest forum.
                        </p>
                        <Button size="sm" variant="outline" onClick={() => setShowNewThread(true)} className="rounded-full px-8">
                            <Plus className="h-4 w-4 mr-2" /> Deschide primul subiect
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filtered.map(thread => (
                            <Link
                                key={thread.id}
                                to={`/forum/thread/${thread.id}`}
                                className="group flex flex-col sm:flex-row sm:items-center gap-4 aero-glass p-5 rounded-2xl border border-border/30 hover:border-primary/40 hover:shadow-aero-lg transition-all duration-300"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {thread.pinned && (
                                            <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary border-none py-0 px-2 rounded-full flex items-center gap-1">
                                                <Pin className="h-2.5 w-2.5" /> FIXAT
                                            </Badge>
                                        )}
                                        {thread.locked && (
                                            <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground border-none py-0 px-2 rounded-full flex items-center gap-1">
                                                <Lock className="h-2.5 w-2.5" /> ÎNCHIS
                                            </Badge>
                                        )}
                                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                            {thread.title}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1 mb-4 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                        {thread.body}
                                    </p>
                                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-2 bg-muted/50 px-2 py-0.5 rounded-full">
                                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {thread.author.email[0].toUpperCase()}
                                            </div>
                                            <span className="font-semibold text-foreground/70 uppercase tracking-tighter">
                                                {thread.author.email.split('@')[0]}
                                            </span>
                                        </div>
                                        <span className="flex items-center gap-1.5 opacity-60">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(thread.updatedAt)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/20">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center bg-primary/5 rounded-xl px-3 py-1 border border-primary/10">
                                            <span className="text-lg font-black text-primary leading-none">{thread._count.posts}</span>
                                            <span className="text-[9px] font-bold text-primary/60 uppercase">Postări</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-primary/40 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
