export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  color?: string; // Optional nice-to-have for aesthetics
}

export type NoteFormData = Pick<Note, 'title' | 'content'>;
