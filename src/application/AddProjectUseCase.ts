import { ProjectModule } from "../module/Project";
import type { ProjectType, ProjectData } from "../module/interfaces/Project";
import type { IProjectRepository } from "./interfaces/IProjectRepository";
import type { ITaskRepository } from "./interfaces/ITaskRepository";
import type { ParsedTask } from "../module/interfaces/ParsedProject";

export class AddProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private taskRepository: ITaskRepository
  ) {}

  async execute(userId: string, name: string, type: ProjectType, initialPhaseName?: string, tasks?: ParsedTask[]): Promise<ProjectData> {
    if (!name || !type) {
      throw new Error("Name and type are required");
    }

    const initialPhase = initialPhaseName || ProjectModule.getInitialPhase(type);

    if (!initialPhase) {
      throw new Error(`Invalid project type: ${type}`);
    }
    
    const project = await this.projectRepository.create(userId, name, type, initialPhase);

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        await this.taskRepository.create(userId, {
          project_id: project.id,
          title: task.title,
          area: task.area || 'Geral',
          description: task.description || null,
          status: 'todo',
          target_date: task.targetDate || null,
          checklists: task.checklists && task.checklists.length > 0 ? task.checklists.join('\n') : null,
          doc_element_version_id: null
        });
      }
    }

    return project;
  }
}
