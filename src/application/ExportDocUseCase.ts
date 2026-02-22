import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { DocTreeNode } from './GetDocTreeUseCase';

export class ExportDocUseCase {
  async execute(docTree: DocTreeNode[]): Promise<string> {
    const processor = unified()
      .use(remarkParse)
      .use(remarkStringify);

    let mdContent = '';

    const processNode = (nodes: DocTreeNode[], level: number) => {
      nodes.forEach(node => {
        // Sanitização de título para evitar quebra de hierarquia MD
        const cleanTitle = node.title.replace(/[#*`_~]/g, '').trim();
        
        // Limita o nível de cabeçalho ao padrão MD (1-6)
        const headerLevel = Math.min(level, 6);
        mdContent += `${'#'.repeat(headerLevel)} ${cleanTitle}

`;
        
        if (node.current_content) {
          mdContent += `${node.current_content}

`;
        }

        if (node.children && node.children.length > 0) {
          processNode(node.children, level + 1);
        }
      });
    };

    processNode(docTree, 1);
    
    const result = await processor.process(mdContent);
    return String(result);
  }
}
