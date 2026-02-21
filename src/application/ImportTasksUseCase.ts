import type { IProjectRepository } from './interfaces/IProjectRepository';
import type { ITaskRepository } from './interfaces/ITaskRepository';
import type { ParsedProject } from '../module/interfaces/ParsedProject';
import type { ProjectType } from '../module/interfaces/Project';

export class ImportTasksUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository
  ) {}

  async execute(userId: string, parsedProject: ParsedProject): Promise<{ projectId: number }> {
    // 1. Create project
    const project = await this.projectRepository.create(
      userId,
      parsedProject.name,
      (parsedProject.type as ProjectType) || 'jogo',
      'Início'
    );

    // 2. Add tasks
    for (const task of parsedProject.tasks) {
      await this.taskRepository.create(userId, {
        project_id: project.id,
        title: task.title,
        area: task.area || 'Geral',
        description: task.description || null,
        status: 'todo',
        target_date: task.targetDate || null,
        checklists: task.checklists.length > 0 ? task.checklists.join('\n') : null,
        doc_element_version_id: null
      });
    }

    return { projectId: project.id };
  }
}
