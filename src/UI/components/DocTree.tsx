import React, { useState } from 'react';
import type { DocElement } from '../contexts/ProjectContext';

interface DocTreeProps {
  docs: DocElement[];
  onSelect: (doc: DocElement) => void;
  selectedDocId?: number;
  level?: number;
}

const DocTree: React.FC<DocTreeProps> = ({ docs, onSelect, selectedDocId, level = 0 }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <ul className={`doc-tree-list level-${level}`}>
      {docs.map(doc => (
        <li key={doc.id} className="doc-tree-item">
          <div 
            className={`doc-tree-label ${selectedDocId === doc.id ? 'active' : ''}`}
            style={{ paddingLeft: `${level * 16}px` }}
          >
            {doc.children && doc.children.length > 0 && (
              <span 
                className={`expand-toggle ${expanded[doc.id] ? 'expanded' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(doc.id);
                }}
              >
                {expanded[doc.id] ? '▼' : '▶'}
              </span>
            )}
            <span className="doc-title" onClick={() => onSelect(doc)}>
              {doc.title}
            </span>
          </div>
          {doc.children && doc.children.length > 0 && expanded[doc.id] && (
            <DocTree 
              docs={doc.children} 
              onSelect={onSelect} 
              selectedDocId={selectedDocId} 
              level={level + 1} 
            />
          )}
        </li>
      ))}
    </ul>
  );
};

export default DocTree;
