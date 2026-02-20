import type { ProjectType } from "@/module/interfaces/Project";

export class ProjectModule {
  static getInitialPhase(type: ProjectType): string {
    return type === 'jogo' ? 'Concepção' : 'Pesquisa UX';
  }
}