import type { IProjectRepository } from './interfaces/IProjectRepository';
import type { ITaskRepository } from './interfaces/ITaskRepository';
import type { IPhaseRepository } from './interfaces/IPhaseRepository';
import type { ISubscriptionRepository } from './interfaces/ISubscriptionRepository';
import type { ParsedPhase } from '../module/interfaces/ParsedProject';

export class ImportTasksUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository,
    private phaseRepository: IPhaseRepository,
    private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(userId: string, parsedProject: ParsedPhase): Promise<{ projectId: number }> {
    // 0. Project limit validation (Freemium logic)
    const projectCount = await this.projectRepository.countByUserId(userId);
    
    if (projectCount >= 1) {
      const subscription = await this.subscriptionRepository.findByUserId(userId);
      const isSubscribed = subscription && 
                           subscription.status === 'active' && 
                           new Date(subscription.current_period_end) > new Date();

      if (!isSubscribed) {
        const error = new Error("Project limit reached. Upgrade to Pro to create more projects.");
        (error as any).status = 403;
        throw error;
      }
    }

    // 1. Create project temporarily
    const project = await this.projectRepository.create(
      userId,
      'Projeto Importado', 
      'jogo',
      0
    );

    // 2. Create the first phase
    const phase = await this.phaseRepository.create(userId, {
      project_id: project.id,
      name: parsedProject.name,
      order_index: 0
    });

    // 3. Update project with the correct current_phase_id
    await this.projectRepository.update(userId, project.id, { current_phase_id: phase.id });

    // 4. Add tasks
    for (const task of parsedProject.tasks) {
      await this.taskRepository.create(userId, {
        project_id: project.id,
        phase_id: phase.id,
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
