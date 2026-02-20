import type { IDocRepository } from "./interfaces/IDocRepository";

export class GetDocsUseCase {
  constructor(private docRepository: IDocRepository) {}

  async execute(userId: string, projectId: number) {
    return this.docRepository.findByProjectId(userId, projectId);
  }
}
