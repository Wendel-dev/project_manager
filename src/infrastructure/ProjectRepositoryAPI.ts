import type { ProjectData, ProjectType } from "../module/interfaces/Project";
import type { IProjectRepository } from "../application/interfaces/IProjectRepository";

export class ProjectRepositoryAPI implements IProjectRepository {
  private getHeaders() {
    const token = localStorage.getItem("indieflow-auth-token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }

  async findAll(userId: string): Promise<ProjectData[]> {
    const response = await fetch("/api/projects", {
      headers: this.getHeaders()
    });
    if (response.status === 401) throw new Error("Unauthorized");
    return response.json();
  }

  async findById(userId: string, id: number): Promise<ProjectData | null> {
    const response = await fetch(`/api/projects/${id}`, {
      headers: this.getHeaders()
    });
    if (response.status === 401) throw new Error("Unauthorized");
    if (!response.ok) return null;
    return response.json();
  }

  async create(userId: string, name: string, type: ProjectType, initialPhase: string): Promise<ProjectData> {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ name, type }),
    });
    if (response.status === 401) throw new Error("Unauthorized");
    if (!response.ok) {
      throw new Error("Failed to create project");
    }
    return response.json();
  }

  async update(userId: string, id: number, updates: Partial<ProjectData>): Promise<void> {
    const response = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    if (response.status === 401) throw new Error("Unauthorized");
    if (!response.ok) {
      throw new Error("Failed to update project");
    }
  }
}
