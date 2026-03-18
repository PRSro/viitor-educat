import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FolderOpen, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Collection {
  id: string;
  name: string;
  lessonIds: string[];
  createdAt: string;
}

const STORAGE_KEY = 'lesson_collections';

function loadCollections(): Collection[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveCollections(cols: Collection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
}

export function LessonCollections() {
  const [collections, setCollections] = useState<Collection[]>(loadCollections);
  const [newName, setNewName] = useState('');

  const createCollection = () => {
    if (!newName.trim()) return;
    const updated = [...collections, {
      id: crypto.randomUUID(),
      name: newName.trim(),
      lessonIds: [],
      createdAt: new Date().toISOString(),
    }];
    setCollections(updated);
    saveCollections(updated);
    setNewName('');
  };

  const deleteCollection = (id: string) => {
    const updated = collections.filter(c => c.id !== id);
    setCollections(updated);
    saveCollections(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New collection name..."
          className="aero-input"
          onKeyDown={e => e.key === 'Enter' && createCollection()}
        />
        <Button className="aero-button-accent" onClick={createCollection}>
          <Plus className="h-4 w-4 mr-1" /> Create
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="aero-glass rounded-xl p-8 text-center text-muted-foreground">
          <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>No collections yet. Create one to organise your lessons.</p>
        </div>
      ) : (
        collections.map(col => (
          <div key={col.id} className="aero-glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">{col.name}</span>
                <Badge variant="outline">{col.lessonIds.length} lessons</Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => deleteCollection(col.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {col.lessonIds.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Empty — bookmark a lesson and add it to this collection.
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
