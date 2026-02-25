import { ProjectModule } from "../module/Project";
import type { ProjectType, ProjectData } from "../module/interfaces/Project";
import type { IProjectRepository } from "./interfaces/IProjectRepository";
import type { ITaskRepository } from "./interfaces/ITaskRepository";
import type { IPhaseRepository } from "./interfaces/IPhaseRepository";
import type { ParsedTask } from "../module/interfaces/ParsedProject";

export class AddProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository,
    private phaseRepository: IPhaseRepository
  ) {}

  async execute(userId: string, name: string, type: ProjectType, initialPhaseName?: string, tasks?: ParsedTask[]): Promise<ProjectData> {
    if (!name || !type) {
      throw new Error("Name and type are required");
    }

    const initialPhaseLabel = initialPhaseName || ProjectModule.getInitialPhase(type);

    if (!initialPhaseLabel) {
      throw new Error(`Invalid project type: ${type}`);
    }
    
    // 1. Create the project temporarily without a valid phase ID (it will be updated)
    // Actually, it's better to create the phase first, but we need project ID for that.
    // So we'll create project with 0 or null and update it.
    const project = await this.projectRepository.create(userId, name, type, 0);

    // 2. Create the first phase
    const phase = await this.phaseRepository.create(userId, {
      project_id: project.id,
      name: initialPhaseLabel,
      order_index: 0
    });

    // 3. Update project with the correct current_phase_id
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
