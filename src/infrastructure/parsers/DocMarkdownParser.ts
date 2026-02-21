import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { IDocParser } from './IDocParser';
import { ParsedDocSection } from '../../module/interfaces/Doc';

export class DocMarkdownParser implements IDocParser {
  canHandle(mimeTypeOrExtension: string): boolean {
    const ext = mimeTypeOrExtension.toLowerCase().replace(/^\./, '');
    return ['md', 'markdown', 'text/markdown'].includes(ext);
  }

  async parse(content: string | Buffer): Promise<ParsedDocSection[]> {
    const text = typeof content === 'string' ? content : content.toString();
    const processor = (unified() as any).use(remarkParse);
    const tree = processor.parse(text);

    const sections: ParsedDocSection[] = [];
    const stack: { section: ParsedDocSection; depth: number }[] = [];

    for (const node of (tree as any).children) {
      if (node.type === 'heading') {
        const depth = node.depth;
        const title = this.toString(node);
        const newSection: ParsedDocSection = {
          title,
          content: '',
          children: [],
        };

        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
          stack.pop();
        }

        if (stack.length === 0) {
          sections.push(newSection);
        } else {
          stack[stack.length - 1].section.children.push(newSection);
        }
        stack.push({ section: newSection, depth });
      } else if (stack.length > 0) {
        // Append content to the current section
        const contentText = this.toString(node);
        if (contentText) {
           stack[stack.length - 1].section.content += (stack[stack.length - 1].section.content ? '\n\n' : '') + contentText;
        }
      } else if (sections.length === 0) {
          // If no heading yet, create an initial section
          const newSection: ParsedDocSection = {
            title: 'Início',
            content: this.toString(node),
            children: [],
          };
          sections.push(newSection);
          stack.push({ section: newSection, depth: 0 });
      } else {
          sections[0].content += (sections[0].content ? '\n\n' : '') + this.toString(node);
      }
    }

    return sections;
  }

  private toString(node: any): string {
    if (node.type === 'text') return node.value;
    if (node.type === 'paragraph') {
      return node.children.map((child: any) => this.toString(child)).join('');
    }
    if (node.type === 'heading') {
      return node.children.map((child: any) => this.toString(child)).join('');
    }
    if (node.type === 'list') {
        return node.children.map((child: any) => this.toString(child)).join('\n');
    }
    if (node.type === 'listItem') {
        const check = node.checked !== null ? (node.checked ? '[x] ' : '[ ] ') : '- ';
        return check + node.children.map((child: any) => this.toString(child)).join('');
    }
    if (node.children) {
      return node.children.map((child: any) => this.toString(child)).join('');
    }
    return '';
  }
}
