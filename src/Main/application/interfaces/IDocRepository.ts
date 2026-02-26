import type { DocElementData, DocVersionData } from "../../module/interfaces/Doc";

export interface IDocRepository {
  findByProjectId(userId: string, projectId: number): Promise<DocElementData[]>;
  createElement(userId: string, projectId: number, title: string, parentId?: number | null): Promise<number>;
  createVersion(userId: string, elementId: number, content: string): Promise<number>;
  updateCurrentVersion(userId: string, elementId: number, versionId: number): Promise<void>;
}
