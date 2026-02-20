import type { TaskData } from "../../module/interfaces/Task";

export interface ITaskRepository {
  findByProjectId(userId: string, projectId: number): Promise<TaskData[]>;
  findById(userId: string, id: number): Promise<TaskData | null>;
  create(userId: string, task: Omit<TaskData, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<number>;
  update(userId: string, id: number, updates: Partial<TaskData>): Promise<void>;
  getAreaStats(userId: string, projectId: number): Promise<{ area: string, todo_count: number, done_count: number }[]>;
  getInertiaTasks(userId: string, projectId: number): Promise<{ id: number, title: string, started_doing_at: string }[]>;
  getOutdatedTasks(userId: string, projectId: number): Promise<any[]>;
}
