
export interface DiaryEntry {
  id: string;
  content: string;
  timestamp: number;
  title?: string;
  mood?: string;
  tags?: string[];
  isAnalayzed: boolean;
  color?: string; // Tailwind class
  emoji?: string;
  author?: string;
}

export interface AnalysisResult {
  title: string;
  mood: string;
  tags: string[];
}

export enum AppView {
  LIBRARY = 'LIBRARY',
  RECORDER = 'RECORDER',
  PLAYER = 'PLAYER',
}
