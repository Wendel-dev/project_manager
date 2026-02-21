import { IDocParser } from './IDocParser';
import { ParsedDocSection } from '../../module/interfaces/Doc';

export class DocTextParser implements IDocParser {
  canHandle(mimeTypeOrExtension: string): boolean {
    const ext = mimeTypeOrExtension.toLowerCase().replace(/^\./, '');
    return ['txt', 'text/plain'].includes(ext);
  }

  async parse(content: string | Buffer): Promise<ParsedDocSection[]> {
    const text = typeof content === 'string' ? content : content.toString();
    const lines = text.split('\n');
    const sections: ParsedDocSection[] = [];
    let currentSection: ParsedDocSection | null = null;

    // Pattern for titles: e.g., "1. Introduction", "CHAPTER 1", etc.
    const titleRegex = /^(\d+(\.\d+)*\s+.+|[A-Z\s]{5,})$/;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (titleRegex.test(trimmedLine)) {
        // Simple hierarchy based on numbering (e.g., "1.1" is child of "1.")
        const newSection: ParsedDocSection = {
          title: trimmedLine,
          content: '',
          children: [],
        };

        if (currentSection === null) {
          sections.push(newSection);
        } else {
          // Check for hierarchy based on common patterns
          const currentLevel = (currentSection.title.match(/\d+\./g) || []).length;
          const newLevel = (trimmedLine.match(/\d+\./g) || []).length;

          if (newLevel > currentLevel) {
            currentSection.children.push(newSection);
          } else {
            sections.push(newSection);
          }
        }
        currentSection = newSection;
      } else if (currentSection) {
        currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
      } else {
        // Text before any title
        currentSection = {
          title: 'Introdução',
          content: trimmedLine,
          children: [],
        };
        sections.push(currentSection);
      }
    }

    return sections;
  }
}
