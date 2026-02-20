import { ProjectModule } from "../module/Project.js";
import type {ProjectType, ProjectData } from "../module/interfaces/Project";
import type { IProjectRepository } from "./interfaces/IProjectRepository";

export class AddProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(userId: string, name: string, type: ProjectType): Promise<ProjectData> {
    if (!name || !type) {
      throw new Error("Name and type are required");
    }

    const initialPhase = ProjectModule.getInitialPhase(type);
    
    return this.projectRepository.create(userId, name, type, initialPhase);
  }
}
