import type { ITaskRepository } from "./interfaces/ITaskRepository";

export class GetGovernanceUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(userId: string, projectId: number) {
    const areaStats = await this.taskRepository.getAreaStats(userId, projectId);
    const topArea = areaStats.sort((a, b) => b.todo_count - a.todo_count)[0];
    
    let nextStep: any = topArea ? { ...topArea } : null;

    if (topArea) {
      const allTasks = await this.taskRepository.findByProjectId(userId, projectId);
      const nextTask = allTasks
        .filter(t => t.area === topArea.area && t.status !== 'done')
        .sort((a, b) => {
          // Rule 1: target_date ASC (nulls last)
          const dateA = a.target_date ? new Date(a.target_date).getTime() : Infinity;
          const dateB = b.target_date ? new Date(b.target_date).getTime() : Infinity;
          
          if (dateA !== dateB) return dateA - dateB;

          // Rule 2: created_at DESC (data maior)
          const createdA = new Date(a.created_at).getTime();
          const createdB = new Date(b.created_at).getTime();
          return createdB - createdA;
        })[0];

      if (nextTask) {
        nextStep.task = nextTask;
      }
    }

    const inertiaTasks = await this.taskRepository.getInertiaTasks(userId, projectId);
    const now = new Date().getTime();
    const stalledTasks = inertiaTasks.filter(t => {
      const started = new Date(t.started_doing_at).getTime();
      return (now - started) > 604800000; // 7 days (7 * 24 * 60 * 60 * 1000)
    });

    const outdatedTasks = await this.taskRepository.getOutdatedTasks(userId, projectId);

    return {
      nextStep,
      stalledTasks,
      outdatedTasks
    };
  }
}
