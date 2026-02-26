import type { IDocRepository } from "./interfaces/IDocRepository";

export class SaveDocUseCase {
  constructor(private docRepository: IDocRepository) {}

  async execute(userId: string, data: { project_id: number, title: string, content: string, element_id?: number, parent_id?: number | null }) {
    let final_element_id = data.element_id;

    if (!final_element_id) {
      final_element_id = await this.docRepository.createElement(userId, data.project_id, data.title, data.parent_id);
    }

    const version_id = await this.docRepository.createVersion(userId, final_element_id, data.content);
    await this.docRepository.updateCurrentVersion(userId, final_element_id, version_id);

    return { id: final_element_id, current_version_id: version_id };
  }
}
