import { IDocumentParser } from './IDocumentParser';
import { ParsedProject, ParsedTask } from '../../module/interfaces/ParsedProject';

export class TextParser implements IDocumentParser {
  canHandle(mimeTypeOrExtension: string): boolean {
    const ext = mimeTypeOrExtension.toLowerCase().replace(/^\./, '');
    return ['txt', 'text/plain'].includes(ext);
  }

  async parse(content: string | Buffer): Promise<ParsedProject> {
    const text = typeof content === 'string' ? content : content.toString();
    const lines = text.split('\n');
    
    const project: ParsedProject = {
      name: 'Untitled Project',
      type: 'General',
      tasks: [],
    };

    let currentArea: string | undefined = undefined;
    let currentTask: ParsedTask | null = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('# ')) {
        project.name = line.substring(2).trim();
      } else if (line.startsWith('## ')) {
        currentArea = line.substring(3).trim();
      } else if (line.startsWith('### ')) {
        if (currentTask) {
          project.tasks.push(currentTask);
        }
        currentTask = {
          title: line.substring(4).trim(),
          area: currentArea,
          description: '',
          checklists: [],
        };
      } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ') || line.startsWith('- ')) {
        if (currentTask) {
          currentTask.checklists.push(line.replace(/^- (\[[ x]\] )?/, '').trim());
        }
      } else if (currentTask) {
        const dateMatch = line.match(/@targetDate\s+(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          currentTask.targetDate = dateMatch[1];
        } else {
          currentTask.description += (currentTask.description ? '\n' : '') + line;
        }
      }
    }

    if (currentTask) {
      project.tasks.push(currentTask);
    }

    return project;
  }
}
