import { getHeaders, handleResponse } from "./ApiUtils";
import type { Task } from "../contexts/ProjectContext";

export class TaskApiService {
  static async findByProject(projectId: number): Promise<Task[]> {
    const response = await fetch(`/api/projects/${projectId}/tasks`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }

  static async create(projectId: number, data: { title: string; area: string; description?: string; doc_element_version_id?: number|null; phase_id?: number|null }): Promise<Task> {
    const response = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  static async update(taskId: number, data: Partial<Task>): Promise<void> {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  static async delete(taskId: number): Promise<void> {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  }
}
