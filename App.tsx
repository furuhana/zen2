import React, { useState, useEffect, useRef } from 'react';
import { Plus, Download, Upload, NotebookPen, Search, FileJson } from 'lucide-react';
import NoteCard from './components/NoteCard';
import NoteModal from './components/NoteModal';
import Button from './components/Button';
import { Note, NoteFormData } from './types';

function App() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('zennotes-data');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('zennotes-data', JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Are you sure you want to delete this memory?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleSaveNote = (data: NoteFormData) => {
    if (editingNote) {
      // Update existing
      setNotes(prev => prev.map(n => 
        n.id === editingNote.id 
          ? { ...n, ...data, updatedAt: Date.now() } 
          : n
      ));
    } else {
      // Create new
      const newNote: Note = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes(prev => [newNote, ...prev]);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dream-log-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = JSON.parse(e.target?.result as string);
        if (Array.isArray(result)) {
            const validNotes = result.filter(n => n.id && n.title !== undefined && n.content !== undefined);
            if (validNotes.length > 0) {
                 const importedNotes: Note[] = validNotes.map((n: any) => ({
                    id: crypto.randomUUID(),
                    title: n.title || '',
                    content: n.content || '',
                    createdAt: n.createdAt || Date.now(),
                    updatedAt: n.updatedAt || Date.now()
                 }));
                 
                 setNotes(prev => [...importedNotes, ...prev]);
                 alert(`Successfully recovered ${importedNotes.length} memories.`);
            } else {
                alert('No valid memories found in this file.');
            }
        } else {
            alert('Invalid format: Must be an array.');
        }
      } catch (err) {
        alert('Failed to parse file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 bg-void text-gray-300 font-sans selection:bg-dream-yellow/30 selection:text-dream-yellow relative overflow-x-hidden">
      
      {/* Dreamcore Noise Overlay */}
      <div className="pointer-events-none fixed inset-0 z-[100] opacity-[0.06] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-void/80 backdrop-blur-md border-b border-dream-yellow/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-5 gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-transparent border border-dream-yellow p-2 rounded-none shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                <NotebookPen className="w-6 h-6 text-dream-yellow" />
              </div>
              <h1 className="text-2xl font-bold text-dream-yellow tracking-widest uppercase drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                DreamNotes
              </h1>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative group flex-1 sm:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-600 group-focus-within:text-dream-yellow transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-dream-yellow/30 rounded-lg leading-5 bg-surface text-gray-200 placeholder-gray-600 focus:outline-none focus:bg-surface focus:border-dream-yellow focus:ring-1 focus:ring-dream-yellow transition-all sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportFile} 
                    accept=".json" 
                    className="hidden" 
                />
                
                <Button variant="secondary" onClick={handleImportTrigger} icon={<Upload className="w-4 h-4"/>} title="Import JSON">
                  Import
                </Button>
                <Button variant="secondary" onClick={handleExport} icon={<Download className="w-4 h-4"/>} title="Export JSON">
                  Export
                </Button>
                <Button onClick={handleAddNote} icon={<Plus className="w-4 h-4"/>}>
                  New Entry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="bg-surface border border-dream-yellow/20 p-8 rounded-full mb-8 shadow-[0_0_40px_rgba(251,191,36,0.05)]">
                <FileJson className="w-16 h-16 text-dream-yellow/50" />
            </div>
            <h3 className="text-2xl font-bold text-dream-yellow mb-3 tracking-wide">VOID DETECTED</h3>
            <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
              No memories found in this sector. <br/>Start logging your dreams or retrieve lost data.
            </p>
            <Button onClick={handleAddNote} size="lg" className="px-10 py-3 uppercase tracking-widest text-sm">
              Initialize Log
            </Button>
          </div>
        ) : filteredNotes.length === 0 ? (
           <div className="text-center py-32 text-gray-600 font-mono">
             Query "{searchQuery}" yielded no results in memory banks.
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        )}
      </main>

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
        initialData={editingNote}
      />
    </div>
  );
}

export default App;