import type { IProjectRepository } from "./interfaces/IProjectRepository";
import type { ProjectData } from "../module/interfaces/Project";

export class UpdateProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(userId: string, id: number, updates: Partial<ProjectData>) {
    await this.projectRepository.update(userId, id, updates);
  }
}
