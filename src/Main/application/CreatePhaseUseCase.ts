import type { IProjectRepository } from './interfaces/IProjectRepository';
import type { ITaskRepository } from './interfaces/ITaskRepository';
import type { IPhaseRepository } from './interfaces/IPhaseRepository';
import type { ParsedTask } from '../module/interfaces/ParsedProject';

export class CreatePhaseUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository,
    private phaseRepository: IPhaseRepository
  ) {}

  async execute(userId: string, projectId: number, phaseName: string, tasks?: ParsedTask[]): Promise<void> {
    if (!phaseName) {
      throw new Error("Phase name is required");
    }

    // 1. Get current phases to determine the order_index
    const existingPhases = await this.phaseRepository.findByProjectId(userId, projectId);
    const orderIndex = existingPhases.length;

    // 2. Create the new phase
    const phase = await this.phaseRepository.create(userId, {
      project_id: projectId,
      name: phaseName,
      order_index: orderIndex
    });

    // 3. Update project's current phase ID
    await this.projectRepository.update(userId, projectId, { current_phase_id: phase.id });

    // 4. Add tasks if provided
    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        await this.taskRepository.create(userId, {
          project_id: projectId,
          phase_id: phase.id,
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
