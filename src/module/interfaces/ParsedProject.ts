export interface ParsedTask {
  title: string;
  area?: string;
  description: string;
  targetDate?: string;
  checklists: string[]; // Itens de checklist (- [ ] ou - [x])
}

export interface ParsedProject {
  name: string;
  type: string; // Etapa/Fase inicial sugerida
  tasks: ParsedTask[];
}
