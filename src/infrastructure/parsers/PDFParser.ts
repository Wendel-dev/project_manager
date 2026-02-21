import { PDFParse } from 'pdf-parse';
import { IDocumentParser } from './IDocumentParser';
import { ParsedPhase } from '../../module/interfaces/ParsedProject';
import { TextParser } from './TextParser';

export class PDFParser implements IDocumentParser {
  private textParser = new TextParser();

  canHandle(mimeTypeOrExtension: string): boolean {
    const ext = mimeTypeOrExtension.toLowerCase().replace(/^\./, '');
    return ['pdf', 'application/pdf'].includes(ext);
  }

  async parse(content: Buffer | string): Promise<ParsedPhase> {
    const buffer = typeof content === 'string' ? Buffer.from(content) : content;
    try {
      const data = await PDFParse(buffer);
      return this.textParser.parse(data.text);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF document');
    }
  }
}
