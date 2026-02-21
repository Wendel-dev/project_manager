export interface ParsedTask {
  title: string;
  area?: string;
  description: string;
  targetDate?: string;
  checklists: string[]; // Itens de checklist (- [ ] ou - [x])
}

export interface ParsedPhase {
  name: string; // Título do documento (# Titulo) usado como nome da fase
  tasks: ParsedTask[];
}
