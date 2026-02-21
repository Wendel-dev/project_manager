import { ParsedDocSection } from "../../module/interfaces/Doc";

export interface IDocParser {
  parse(content: string | Buffer): Promise<ParsedDocSection[]>;
  canHandle(mimeTypeOrExtension: string): boolean;
}
