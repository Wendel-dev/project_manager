import { IDocParser } from "../infrastructure/parsers/IDocParser";
import { ParsedDocSection } from "../module/interfaces/Doc";

export class ParseDocDocumentUseCase {
  constructor(private parsers: IDocParser[]) {}

  async execute(content: string | Buffer, filename: string): Promise<ParsedDocSection[]> {
    const extension = filename.split('.').pop() || '';
    const parser = this.parsers.find(p => p.canHandle(extension));
    
    if (!parser) {
      throw new Error(`Nenhum parser encontrado para o arquivo: ${filename}`);
    }

    return await parser.parse(content);
  }
}
