import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  Notification,
  formatNotificationTime 
} from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Bell, 
  BookOpen, 
  FileText, 
  Link as LinkIcon, 
  Layers, 
  UserPlus, 
  Check,
  CheckCheck,
  X,
  Timer,
  Music,
  Play,
  Pause,
  Volume2,
  Settings,
  RotateCcw,
  Plus,
  Minus,
  Coffee,
  Brain,
  Target,
  Zap
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FOCUS_MUSIC = [
  { id: 'rain', name: 'Ploaie', frequency: '432Hz', url: 'https://cdn.pixabay.com/download/audio/2022/05/13/audio_257112181d.mp3' },
  { id: 'forest', name: 'Pădure', frequency: '417Hz', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_12c9383bf3.mp3' },
  { id: 'waves', name: 'Valuri', frequency: '396Hz', url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3' },
  { id: 'stream', name: 'Râu', frequency: '432Hz', url: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_110af7d0e4.mp3' },
  { id: 'birds', name: 'Păsări', frequency: '441Hz', url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c43.mp3' },
  { id: 'night', name: 'Noapte', frequency: '417Hz', url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_ac0c5a0f36.mp3' },
];

const TIMER_PRESETS = [
  { name: 'Pomodoro', work: 25, break: 5, icon: Timer },
  { name: 'Scurt', work: 15, break: 3, icon: Zap },
  { name: 'Mediu', work: 30, break: 10, icon: Brain },
  { name: 'Lung', work: 45, break: 15, icon: Target },
];

export function NotificationBell() {
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const prevOpenRef = useRef(open);

  // Timer state
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Music state
  const [currentTrack, setCurrentTrack] = useState(FOCUS_MUSIC[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([30]);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      fetchNotifications();
    }
    prevOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);
    
    fetchUnreadCount();
    
    return () => clearInterval(interval);
  }, []);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      if (timerMode === 'focus') {
        setSessionsCompleted(prev => prev + 1);
        playNotificationSound();
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft, timerMode]);

  // Audio setup
  useEffect(() => {
    audioRef.current = new Audio(currentTrack.url);
    audioRef.current.loop = true;
    audioRef.current.volume = volume[0] / 100;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
    }
  }, [volume, isMuted]);

  const playNotificationSound = () => {
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => setIsTimerRunning(true);
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerMode === 'focus' ? workDuration * 60 : breakDuration * 60);
  };

  const handleModeChange = (mode: 'focus' | 'break') => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    setTimeLeft(mode === 'focus' ? workDuration * 60 : breakDuration * 60);
  };

  const handlePreset = (preset: typeof TIMER_PRESETS[0]) => {
    setWorkDuration(preset.work);
    setBreakDuration(preset.break);
    setTimerMode('focus');
    setIsTimerRunning(false);
    setTimeLeft(preset.work * 60);
  };

  async function fetchNotifications() {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUnreadCount() {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }

  async function handleMarkAsRead(notification: Notification) {
    if (notification.read) return;
    
    try {
      await markAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }

  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'COURSE_UPDATE': return <BookOpen className="h-4 w-4" />;
      case 'NEW_ARTICLE': return <FileText className="h-4 w-4" />;
      case 'NEW_RESOURCE': return <LinkIcon className="h-4 w-4" />;
      case 'FLASHCARD_REMINDER': return <Layers className="h-4 w-4" />;
      case 'ENROLLMENT': return <UserPlus className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  }

  const notificationSettingsEnabled = 
    settings?.emailNotifications || 
    settings?.courseUpdates || 
    settings?.newArticles || 
    settings?.newResources || 
    settings?.flashcardReminders;

  if (!notificationSettingsEnabled) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
            <TabsTrigger value="timer" className="flex gap-2">
              <Timer className="h-4 w-4" />
              Timer
            </TabsTrigger>
            <TabsTrigger value="music" className="flex gap-2">
              <Music className="h-4 w-4" />
              Focus
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex gap-2">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? `Notif. (${unreadCount})` : 'Notif.'}
            </TabsTrigger>
          </TabsList>

          {/* Timer Tab */}
          <TabsContent value="timer" className="p-4 space-y-4">
            {/* Timer Display */}
            <div className="text-center space-y-2">
              <div className={`text-5xl font-bold font-mono ${timerMode === 'focus' ? 'text-primary' : 'text-green-500'}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="flex justify-center gap-2">
                <Button
                  variant={timerMode === 'focus' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('focus')}
                >
                  Focus
                </Button>
                <Button
                  variant={timerMode === 'break' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('break')}
                >
                  <Coffee className="h-4 w-4 mr-1" />
                  Pauză
                </Button>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-2">
              {!isTimerRunning ? (
                <Button onClick={handleStartTimer} className="gap-2">
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              ) : (
                <Button onClick={handlePauseTimer} variant="outline" className="gap-2">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button onClick={handleResetTimer} variant="ghost" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Presets</p>
              <div className="grid grid-cols-4 gap-2">
                {TIMER_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="flex flex-col h-auto py-2 text-xs"
                    onClick={() => handlePreset(preset)}
                  >
                    <preset.icon className="h-4 w-4 mb-1" />
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Duration Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Focus: {workDuration} min</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setWorkDuration(Math.max(5, workDuration - 5))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setWorkDuration(Math.min(60, workDuration + 5))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pauză: {breakDuration} min</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setBreakDuration(Math.max(1, breakDuration - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setBreakDuration(Math.min(30, breakDuration + 1))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sessions */}
            <div className="text-center text-sm text-muted-foreground">
              Sesiuni completate: <span className="font-bold text-primary">{sessionsCompleted}</span>
            </div>
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="p-4 space-y-4">
            {/* Now Playing */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentTrack.name}</p>
                <p className="text-xs text-muted-foreground">{currentTrack.frequency} Solfeggio</p>
              </div>
            </div>

            {/* Track List */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Sunete pentru concentrare</p>
              <ScrollArea className="h-40">
                {FOCUS_MUSIC.map((track) => (
                  <button
                    key={track.id}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      currentTrack.id === track.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setCurrentTrack(track);
                      setIsPlaying(true);
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{track.name}</p>
                      <p className="text-xs text-muted-foreground">{track.frequency}</p>
                    </div>
                    {currentTrack.id === track.id && isPlaying && (
                      <div className="flex gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-primary animate-pulse"
                            style={{
                              height: `${12 + Math.random() * 8}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </ScrollArea>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={isMuted ? [0] : volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground text-center">
              Frecvențele Solfeggio sunt tonuri care, conform cercetărilor, 
              pot Promovare relaxarea și concentrarea.
            </p>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="p-0">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold">Notificări</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Citește tot
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-80">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nu ai notificări</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-muted/30' : ''
                      }`}
                      onClick={() => handleMarkAsRead(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                      {notification.link && (
                        <Link 
                          to={notification.link}
                          className="text-xs text-primary hover:underline mt-2 block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Vezi detalii
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {notifications.length > 0 && (
              <div className="p-2 border-t">
                <Button variant="ghost" className="w-full text-xs" asChild>
                  <Link to="/settings" onClick={() => setOpen(false)}>
                    Setări Notificări
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
