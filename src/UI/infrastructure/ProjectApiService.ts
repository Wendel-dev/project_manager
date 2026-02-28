import { getHeaders, handleResponse } from "./ApiUtils";
import type { ProjectData, ProjectType } from "../../Project/module/interfaces/Project";
import type { ParsedPhase } from "../../Project/module/interfaces/ParsedProject";

export class ProjectApiService {
  static async findAll(): Promise<ProjectData[]> {
    const response = await fetch("/api/projects", {
      headers: getHeaders()
    });
    return handleResponse(response);
  }

  static async findById(id: number): Promise<ProjectData> {
    const response = await fetch(`/api/projects/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }

  static async create(data: { name: string; type: ProjectType; initialPhaseName?: string; tasks?: ParsedPhase['tasks'] }): Promise<ProjectData> {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  static async update(id: number, data: Partial<ProjectData>): Promise<void> {
    const response = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  static async delete(id: number): Promise<void> {
    const response = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  }
}
