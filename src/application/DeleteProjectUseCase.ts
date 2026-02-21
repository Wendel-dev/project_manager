import type { IProjectRepository } from "./interfaces/IProjectRepository";

export class DeleteProjectUseCase {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(userId: string, id: number): Promise<void> {
    if (!id) {
      throw new Error("Project ID is required");
    }

    const project = await this.projectRepository.findById(userId, id);
    if (!project) {
      throw new Error("Project not found or not owned by user");
    }

    await this.projectRepository.delete(userId, id);
  }
}
