import type { ITaskRepository } from "./interfaces/ITaskRepository";

export class AddTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(userId: string, task: { project_id: number, phase_id?: number, title: string, description?: string, area: string, doc_element_version_id?: number }) {
    if (!task.title || !task.area) {
      throw new Error("Title and area are required");
    }

    const id = await this.taskRepository.create(userId, {
      project_id: task.project_id,
      phase_id: task.phase_id || null,
      title: task.title,
      description: task.description || null,
      area: task.area,
      status: 'todo',
      doc_element_version_id: task.doc_element_version_id || null
    });

    return { id, ...task, status: 'todo' };
  }
}
