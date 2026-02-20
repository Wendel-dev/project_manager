import type { ITaskRepository } from "./interfaces/ITaskRepository";

export class GetGovernanceUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(userId: string, projectId: number) {
    const areaStats = await this.taskRepository.getAreaStats(userId, projectId);
    const nextStep = areaStats.sort((a, b) => b.todo_count - a.todo_count)[0];

    const inertiaTasks = await this.taskRepository.getInertiaTasks(userId, projectId);
    const now = new Date().getTime();
    const stalledTasks = inertiaTasks.filter(t => {
      const started = new Date(t.started_doing_at).getTime();
      return (now - started) > 10000; // 10 seconds for testing as in index.ts
    });

    const outdatedTasks = await this.taskRepository.getOutdatedTasks(userId, projectId);

    return {
      nextStep,
      stalledTasks,
      outdatedTasks
    };
  }
}
