import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { IDocumentParser } from './IDocumentParser';
import { ParsedProject, ParsedTask } from '../../module/interfaces/ParsedProject';

export class MarkdownParser implements IDocumentParser {
  canHandle(mimeTypeOrExtension: string): boolean {
    const ext = mimeTypeOrExtension.toLowerCase().replace(/^\./, '');
    return ['md', 'markdown', 'text/markdown'].includes(ext);
  }

  async parse(content: string | Buffer): Promise<ParsedProject> {
    const text = typeof content === 'string' ? content : content.toString();
    const processor = unified().use(remarkParse);
    const tree = processor.parse(text);

    const project: ParsedProject = {
      name: 'Untitled Project',
      type: 'General',
      tasks: [],
    };

    let currentArea: string | undefined = undefined;
    let currentTask: ParsedTask | null = null;

    for (const node of (tree as any).children) {
      if (node.type === 'heading') {
        if (node.depth === 1) {
          project.name = this.toString(node);
        } else if (node.depth === 2) {
          currentArea = this.toString(node);
        } else if (node.depth === 3) {
          if (currentTask) {
            project.tasks.push(currentTask);
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
               
               const check = item.checked !== null ? (item.checked ? '[x] ' : '[ ] ') : '';
               // If itemText already has the checkbox, don't duplicate it.
               // Some remark parsers might include it in the text.
               const finalItem = itemText.startsWith('[ ]') || itemText.startsWith('[x]') 
                 ? itemText 
                 : check + itemText;
               
               currentTask.checklists.push(finalItem);
            }
          }
        }
      }
    }

    if (currentTask) {
      project.tasks.push(currentTask);
    }

    return project;
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
