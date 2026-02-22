import type { IProjectRepository } from './interfaces/IProjectRepository';
import type { ITaskRepository } from './interfaces/ITaskRepository';
import type { ParsedTask } from '../module/interfaces/ParsedProject';

export class TransitionPhaseUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository
  ) {}

  async execute(userId: string, projectId: number, nextPhaseName: string, tasks?: ParsedTask[]): Promise<void> {
    if (!nextPhaseName) {
      throw new Error("Next phase name is required");
    }

    // 1. Update project phase
    await this.projectRepository.update(userId, projectId, { current_phase: nextPhaseName });

    // 2. Add tasks if provided
    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        await this.taskRepository.create(userId, {
          project_id: projectId,
          title: task.title,
          area: task.area || 'Geral',
          description: task.description || null,
          status: 'todo',
          target_date: task.targetDate || null,
          checklists: task.checklists && task.checklists.length > 0 ? JSON.stringify(task.checklists) : null,
          doc_element_version_id: null
        });
      }
    }
  }
}
