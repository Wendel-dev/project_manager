import type { ProjectType } from "@/Main/module/interfaces/Project";

export const PHASES: Record<ProjectType, string[]> = {
  jogo: ['Conceito', 'Protótipo', 'Alpha', 'Beta', 'Gold','Pós-lançamento'],
  aplicativo: ['Pesquisa UX', 'MVP', 'Beta', 'Escalamento', 'Manutenção']
};

export class ProjectModule {
  static getInitialPhase(type: ProjectType): string {
    return PHASES[type][0]||"";
  }

  static getPhases(type: ProjectType): string[] {
    return PHASES[type] || [];
  }
}