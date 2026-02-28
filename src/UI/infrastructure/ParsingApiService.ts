import { getHeaders, handleResponse } from "./ApiUtils";
import type { ParsedPhase } from "../../Project/module/interfaces/ParsedProject";
import type { ParsedDocSection } from "../../Project/module/interfaces/Doc";

export class ParsingApiService {
  static async parseProjectFile(file: File): Promise<ParsedPhase> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/parse-document", {
      method: "POST",
      body: formData
    });
    return handleResponse(response);
  }

  static async parseDocHierarchy(file: File): Promise<ParsedDocSection[]> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/parse-doc-hierarchy", {
      method: "POST",
      body: formData
    });
    return handleResponse(response);
  }

  static async importProject(data: ParsedPhase): Promise<void> {
    const response = await fetch("/api/import-project", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }
}
