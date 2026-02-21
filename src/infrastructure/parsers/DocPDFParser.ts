import { PDFParse } from 'pdf-parse';
import { IDocParser } from './IDocParser';
import { ParsedDocSection } from '../../module/interfaces/Doc';
import { DocTextParser } from './DocTextParser';

export class DocPDFParser implements IDocParser {
  private textParser = new DocTextParser();

  canHandle(mimeTypeOrExtension: string): boolean {
    const ext = mimeTypeOrExtension.toLowerCase().replace(/^\./, '');
    return ['pdf', 'application/pdf'].includes(ext);
  }

  async parse(content: Buffer | string): Promise<ParsedDocSection[]> {
    const buffer = typeof content === 'string' ? Buffer.from(content) : content;
    try {
      const data = await (PDFParse as any)(buffer);
      return this.textParser.parse(data.text);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF document');
    }
  }
}
