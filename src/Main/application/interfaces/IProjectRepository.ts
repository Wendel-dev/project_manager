import type { ProjectData, ProjectType } from "@/Main/module/interfaces/Project";

export interface IProjectRepository {
  create(userId: string, name: string, type: ProjectType, initialPhaseId: number): Promise<ProjectData>;
  findAll(userId: string): Promise<ProjectData[]>;
  findById(userId: string, id: number): Promise<ProjectData | null>;
  update(userId: string, id: number, updates: Partial<ProjectData>): Promise<void>;
  delete(userId: string, id: number): Promise<void>;
}