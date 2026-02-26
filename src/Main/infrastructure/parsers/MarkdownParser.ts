import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { IDocumentParser } from './IDocumentParser';
import { ParsedPhase, ParsedTask } from '../../module/interfaces/ParsedProject';

export class MarkdownParser implements IDocumentParser {
  canHandle(mimeTypeOrExtension: string): boolean {
    const ext = mimeTypeOrExtension.toLowerCase().replace(/^\./, '');
    return ['md', 'markdown', 'text/markdown'].includes(ext);
  }

  async parse(content: string | Buffer): Promise<ParsedPhase> {
    const text = typeof content === 'string' ? content : content.toString();
    const processor = unified().use(remarkParse);
    const tree = processor.parse(text);

    const phase: ParsedPhase = {
      name: 'Nova Fase',
      tasks: [],
    };

    let currentArea: string | undefined = undefined;
    let currentTask: ParsedTask | null = null;

    for (const node of (tree as any).children) {
      if (node.type === 'heading') {
        if (node.depth === 1) {
          phase.name = this.toString(node);
        } else if (node.depth === 2) {
          currentArea = this.toString(node);
        } else if (node.depth === 3) {
          if (currentTask) {
            phase.tasks.push(currentTask);
          }
          currentTask = {
            title: this.toString(node),
            area: currentArea,
            description: '',
            checklists: [],
          };
        }
      } else if (node.type === 'paragraph') {
        if (currentTask) {
          const pText = this.toString(node);
          const cleanedText = this.extractTargetDate(pText, currentTask);
          if (cleanedText) {
            currentTask.description += (currentTask.description ? '\n' : '') + cleanedText;
          }
        }
      } else if (node.type === 'list') {
        if (currentTask) {
          for (const item of node.children) {
            if (item.type === 'listItem') {
              let itemText = this.toString(item);
              itemText = this.extractTargetDate(itemText, currentTask);
              
              const isCompleted = item.checked === true || itemText.startsWith('[x]');
              
              currentTask.checklists.push({
                text: itemText.replace(/^\[[ x]\]\s*/, '').trim(),
                completed: isCompleted
              });
            }
          }
        }
      }
    }

    if (currentTask) {
      phase.tasks.push(currentTask);
    }

    return phase;
  }

  private extractTargetDate(text: string, task: ParsedTask): string {
    const dateRegex = /@targetDate\s+(\d{4}-\d{2}-\d{2})/;
    const match = text.match(dateRegex);
    if (match) {
      task.targetDate = match[1];
      return text.replace(dateRegex, '').trim();
    }
    return text;
  }

  private toString(node: any): string {
    if (node.type === 'text') return node.value;
    if (node.children) {
      return node.children.map((child: any) => this.toString(child)).join('');
    }
    return '';
  }
}
