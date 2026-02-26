import { IDocRepository } from "./interfaces/IDocRepository";
import { DocElementData } from "../module/interfaces/Doc";

export interface DocTreeNode extends DocElementData {
  children: DocTreeNode[];
}

export class GetDocTreeUseCase {
  constructor(private docRepository: IDocRepository) {}

  async execute(userId: string, projectId: number): Promise<DocTreeNode[]> {
    const elements = await this.docRepository.findByProjectId(userId, projectId);
    
    const elementMap = new Map<number, DocTreeNode>();
    const roots: DocTreeNode[] = [];

    // First pass: create nodes
    elements.forEach(el => {
      elementMap.set(el.id, { ...el, children: [] });
    });

    // Second pass: build tree
    elements.forEach(el => {
      const node = elementMap.get(el.id)!;
      if (el.parent_id === null) {
        roots.push(node);
      } else {
        const parent = elementMap.get(el.parent_id);
        if (parent) {
          parent.children.push(node);
        } else {
          // If parent not found (e.g., deleted or across projects), treat as root
          roots.push(node);
        }
      }
    });

    return roots;
  }
}
