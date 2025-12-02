import React from 'react';
import { Edit2, Trash2, Clock } from 'lucide-react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete }) => {
  const formattedDate = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(note.updatedAt));

  return (
    <div className="group relative bg-surface/60 backdrop-blur-sm rounded-none border border-dream-yellow/20 p-5 shadow-lg shadow-black/50 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 hover:border-dream-yellow/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.1)]">
      {/* Decorative corner marker */}
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-l-[20px] border-t-dream-yellow/20 border-l-transparent group-hover:border-t-dream-yellow transition-colors duration-300"></div>

      <div className="flex-1 mb-4">
        <h3 className="text-lg font-bold text-dream-yellow mb-2 line-clamp-2 leading-tight tracking-wide">
          {note.title}
        </h3>
        <p className="text-gray-400 text-sm whitespace-pre-wrap line-clamp-6 leading-relaxed font-light">
          {note.content}
        </p>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-dream-yellow/10 mt-auto">
        <div className="flex items-center text-xs text-gray-600 gap-1 group-hover:text-dream-yellow/70 transition-colors">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{formattedDate}</span>
        </div>
        
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            onClick={() => onEdit(note)}
            className="p-2 text-gray-500 hover:text-dream-yellow hover:bg-dream-yellow/10 rounded-md transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(note.id)}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;