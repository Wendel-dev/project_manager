import { ProjectModule } from "../module/Project";
import type { ProjectType, ProjectData } from "../module/interfaces/Project";
import type { IProjectRepository } from "./interfaces/IProjectRepository";
import type { ITaskRepository } from "./interfaces/ITaskRepository";
import type { IPhaseRepository } from "./interfaces/IPhaseRepository";
import type { ISubscriptionRepository } from "./interfaces/ISubscriptionRepository";
import type { ParsedTask } from "../module/interfaces/ParsedProject";

export class AddProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository,
    private phaseRepository: IPhaseRepository,
    private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(userId: string, name: string, type: ProjectType, initialPhaseName?: string, tasks?: ParsedTask[]): Promise<ProjectData> {
    if (!name || !type) {
      throw new Error("Name and type are required");
    }

    // 1. Project limit validation (Freemium logic)
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

    const initialPhaseLabel = initialPhaseName || ProjectModule.getInitialPhase(type);

    if (!initialPhaseLabel) {
      throw new Error(`Invalid project type: ${type}`);
    }
    
    // 2. Create the project temporarily without a valid phase ID (it will be updated)
    const project = await this.projectRepository.create(userId, name, type, 0);

    // 3. Create the first phase
    const phase = await this.phaseRepository.create(userId, {
      project_id: project.id,
      name: initialPhaseLabel,
      order_index: 0
    });

    // 4. Update project with the correct current_phase_id
    await this.projectRepository.update(userId, project.id, { current_phase_id: phase.id });
    project.current_phase_id = phase.id;

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        await this.taskRepository.create(userId, {
          project_id: project.id,
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

    return project;
  }
}
