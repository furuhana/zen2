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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg shadow-xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            {initialData ? 'Edit Note' : 'New Note'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold text-gray-900 placeholder:text-gray-400 border-none outline-none bg-transparent"
              autoFocus
            />
          </div>
          
          <div className="mb-6">
            <textarea
              placeholder="Write your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-64 resize-none text-gray-700 placeholder:text-gray-400 border-none outline-none bg-transparent leading-relaxed custom-scrollbar"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={<Save className="w-4 h-4" />}>
              Save Note
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;