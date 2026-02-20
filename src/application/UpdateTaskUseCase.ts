import type { ITaskRepository } from "./interfaces/ITaskRepository";
import type { TaskData } from "../module/interfaces/Task";

export class UpdateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(userId: string, id: number, updates: Partial<TaskData>) {
    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    // Special logic for started_doing_at
    if (updates.status === 'doing') {
      updates.started_doing_at = new Date().toISOString();
    } else if (updates.status === 'done' || updates.status === 'todo') {
      updates.started_doing_at = null;
    }

    await this.taskRepository.update(userId, id, updates);
  }
}
