import type { ProjectType } from "@/module/interfaces/Project";

export const PHASES: Record<ProjectType, string[]> = {
  jogo: ['Concepção', 'Pré-produção', 'Produção', 'Polimento', 'Lançamento'],
  aplicativo: ['Pesquisa UX', 'MVP', 'Beta', 'Escalamento', 'Manutenção']
};

export class ProjectModule {
  static getInitialPhase(type: ProjectType): string | undefined {
    return PHASES[type][0];
  }

  static getPhases(type: ProjectType): string[] {
    return PHASES[type] || [];
  }
}