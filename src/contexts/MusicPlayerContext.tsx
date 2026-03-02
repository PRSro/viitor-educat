import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface MusicPlayerContextType {
  isOpen: boolean;
  openPlayer: () => void;
  closePlayer: () => void;
  togglePlayer: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPlayer = useCallback(() => setIsOpen(true), []);
  const closePlayer = useCallback(() => setIsOpen(false), []);
  const togglePlayer = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <MusicPlayerContext.Provider value={{ isOpen, openPlayer, closePlayer, togglePlayer }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
}
