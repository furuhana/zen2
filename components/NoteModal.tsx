import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Note, NoteFormData } from '../types';
import Button from './Button';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NoteFormData) => void;
  initialData?: Note | null;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setContent(initialData?.content || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    onSave({ title, content });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300">
      <div className="bg-surface border border-dream-yellow/30 w-full max-w-lg shadow-[0_0_50px_rgba(251,191,36,0.1)] overflow-hidden animate-in zoom-in-95 duration-300 rounded-lg relative">
        
        {/* Glow effect at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-dream-yellow to-transparent opacity-50"></div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-dream-yellow/10">
          <h2 className="text-xl font-bold text-dream-yellow tracking-widest uppercase">
            {initialData ? 'EDIT MEMORY' : 'NEW ENTRY'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-dream-yellow p-1 rounded-full hover:bg-dream-yellow/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="SUBJECT..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold text-gray-200 placeholder:text-gray-700 border-b border-gray-800 focus:border-dream-yellow outline-none bg-transparent transition-colors py-2"
              autoFocus
            />
          </div>
          
          <div className="mb-6">
            <textarea
              placeholder="Record your thoughts here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-64 resize-none text-gray-300 placeholder:text-gray-700 border-none outline-none bg-transparent leading-relaxed custom-scrollbar selection:bg-dream-yellow/30 selection:text-dream-yellow"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-dream-yellow/10">
            <Button type="button" variant="ghost" onClick={onClose}>
              DISCARD
            </Button>
            <Button type="submit" icon={<Save className="w-4 h-4" />}>
              SAVE MEMORY
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;