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
    if (window.confirm('Are you sure you want to delete this note?')) {
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
    link.download = `zen-notes-${new Date().toISOString().slice(0, 10)}.json`;
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
                 alert(`Successfully imported ${importedNotes.length} notes.`);
            } else {
                alert('No valid notes found in this file.');
            }
        } else {
            alert('Invalid file format. Expected a JSON array.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
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
    <div className="min-h-screen pb-20 bg-gray-50 text-gray-900 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <NotebookPen className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                ZenNotes
              </h1>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative group flex-1 sm:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition-all sm:text-sm"
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
                  New Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white border border-gray-100 p-6 rounded-full mb-6 shadow-sm">
                <NotebookPen className="w-12 h-12 text-indigo-200" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-500 max-w-sm mb-8">
              Capture your ideas, daily tasks, and creative thoughts in a distraction-free environment.
            </p>
            <Button onClick={handleAddNote} size="lg">
              Create your first note
            </Button>
          </div>
        ) : filteredNotes.length === 0 ? (
           <div className="text-center py-24 text-gray-500">
             No notes found matching "{searchQuery}"
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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