import type { IDocumentParser } from '../infrastructure/parsers/IDocumentParser';
import { MarkdownParser } from '../infrastructure/parsers/MarkdownParser';
import { PDFParser } from '../infrastructure/parsers/PDFParser';
import { TextParser } from '../infrastructure/parsers/TextParser';
import type { ParsedPhase } from '../module/interfaces/ParsedProject';

export class ParseDocumentUseCase {
  private parsers: IDocumentParser[] = [
    new MarkdownParser(),
    new PDFParser(),
    new TextParser()
  ];

  async execute(content: string | Buffer, type: string): Promise<ParsedPhase> {
    const parser = this.parsers.find(p => p.canHandle(type));
    
    if (!parser) {
      throw new Error(`Unsupported file type: ${type}`);
    }

    return await parser.parse(content);
  }
}
