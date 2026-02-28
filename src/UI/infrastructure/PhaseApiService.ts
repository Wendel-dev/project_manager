import { getHeaders, handleResponse } from "./ApiUtils";
import type { PhaseData } from "../../Project/module/interfaces/Phase";
import type { ParsedPhase } from "../../Project/module/interfaces/ParsedProject";

export class PhaseApiService {
  static async findByProject(projectId: number): Promise<PhaseData[]> {
    const response = await fetch(`/api/projects/${projectId}/phases`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }

  static async create(projectId: number, data: { phaseName: string; tasks?: ParsedPhase['tasks'] }): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/phases`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }
}
