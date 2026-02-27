import type { ITaskRepository } from "./interfaces/ITaskRepository";
import type { TaskData } from "../module/interfaces/Task";

export class GetTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(userId: string, projectId: number): Promise<TaskData[]> {
    return this.taskRepository.findByProjectId(userId, projectId);
  }
}
