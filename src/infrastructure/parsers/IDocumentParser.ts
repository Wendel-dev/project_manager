import { ParsedPhase } from "../../module/interfaces/ParsedProject";

export interface IDocumentParser {
  parse(content: string | Buffer): Promise<ParsedPhase>;
  canHandle(mimeTypeOrExtension: string): boolean;
}
