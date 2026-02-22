import type { IProjectRepository } from './interfaces/IProjectRepository';
import type { ITaskRepository } from './interfaces/ITaskRepository';
import type { ParsedPhase } from '../module/interfaces/ParsedProject';

export class ImportTasksUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository
  ) {}

  async execute(userId: string, parsedProject: ParsedPhase): Promise<{ projectId: number }> {
    // 1. Create project (Note: here we don't have project name anymore in ParsedProject)
    const project = await this.projectRepository.create(
      userId,
      'Projeto Importado', // Defaulting as we don't have it in ParsedProject anymore
      'jogo',
      parsedProject.name
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
        checklists: task.checklists.length > 0 ? JSON.stringify(task.checklists) : null,
        doc_element_version_id: null
      });
    }

    return { projectId: project.id };
  }
}
