import { getHeaders, handleResponse } from "./ApiUtils";
import type { DocElement } from "../contexts/ProjectContext";
import type { ParsedDocSection } from "../../Project/module/interfaces/Doc";

export class DocApiService {
  static async getTree(projectId: number): Promise<DocElement[]> {
    const response = await fetch(`/api/projects/${projectId}/docs`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }

  static async save(projectId: number, data: { title: string; content: string; element_id?: number; parent_id?: number | null }): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/docs`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  static async importHierarchy(projectId: number, sections: ParsedDocSection[]): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/import-docs`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(sections),
    });
    return handleResponse(response);
  }
}
