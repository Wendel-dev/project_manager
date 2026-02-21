import { IDocRepository } from "./interfaces/IDocRepository";
import { ParsedDocSection } from "../module/interfaces/Doc";

export class ImportDocUseCase {
  constructor(private docRepository: IDocRepository) {}

  async execute(userId: string, projectId: number, sections: ParsedDocSection[], parentId: number | null = null): Promise<void> {
    for (const section of sections) {
      const elementId = await this.docRepository.createElement(userId, projectId, section.title, parentId);
      
      if (section.content) {
        const versionId = await this.docRepository.createVersion(userId, elementId, section.content);
        await this.docRepository.updateCurrentVersion(userId, elementId, versionId);
      }

      if (section.children.length > 0) {
        await this.execute(userId, projectId, section.children, elementId);
      }
    }
  }
}
