import { IDocumentParser } from './IDocumentParser';
import { ParsedPhase, ParsedTask } from '../../module/interfaces/ParsedProject';

export class TextParser implements IDocumentParser {
  canHandle(mimeTypeOrExtension: string): boolean {
    const ext = mimeTypeOrExtension.toLowerCase().replace(/^\./, '');
    return ['txt', 'text/plain'].includes(ext);
  }

  async parse(content: string | Buffer): Promise<ParsedPhase> {
    const text = typeof content === 'string' ? content : content.toString();
    const lines = text.split('\n');
    
    const phase: ParsedPhase = {
      name: 'Nova Fase',
      tasks: [],
    };

    let currentArea: string | undefined = undefined;
    let currentTask: ParsedTask | null = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('# ')) {
        phase.name = line.substring(2).trim();
      } else if (line.startsWith('## ')) {
        currentArea = line.substring(3).trim();
      } else if (line.startsWith('### ')) {
        if (currentTask) {
          phase.tasks.push(currentTask);
        }
        currentTask = {
          title: line.substring(4).trim(),
          area: currentArea,
          description: '',
          checklists: [],
        };
            } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ') || line.startsWith('- ')) {
              if (currentTask) {
                const isCompleted = line.startsWith('- [x] ');
                const itemText = line.replace(/^- (\[[ x]\] )?/, '').trim();
                currentTask.checklists.push({
                  text: itemText,
                  completed: isCompleted
                });
              }
            }
       else if (currentTask) {
        const dateMatch = line.match(/@targetDate\s+(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          currentTask.targetDate = dateMatch[1];
        } else {
          currentTask.description += (currentTask.description ? '\n' : '') + line;
        }
      }
    }

    if (currentTask) {
      phase.tasks.push(currentTask);
    }

    return phase;
  }
}
