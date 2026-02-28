import { getHeaders, handleResponse } from "./ApiUtils";

export class GovernanceApiService {
  static async getReport(projectId: number): Promise<any> {
    const response = await fetch(`/api/projects/${projectId}/governance`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }
}
