import { ParsedProject } from "../../module/interfaces/ParsedProject";

export interface IDocumentParser {
  parse(content: string | Buffer): Promise<ParsedProject>;
  canHandle(mimeTypeOrExtension: string): boolean;
}
