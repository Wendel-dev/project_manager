import type { ChecklistItem } from './Task';

export interface ParsedTask {
  title: string;
  area?: string;
  description: string;
  targetDate?: string;
  checklists: ChecklistItem[]; // Alterado de string[] para ChecklistItem[]
}

export interface ParsedPhase {
  name: string; // Título do documento (# Titulo) usado como nome da fase
  tasks: ParsedTask[];
}
