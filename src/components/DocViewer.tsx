import React from 'react';
import { DocElement } from '../contexts/ProjectContext';

interface DocViewerProps {
  doc: DocElement;
  level?: number;
}

const DocViewer: React.FC<DocViewerProps> = ({ doc, level = 1 }) => {
  const HeadingTag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
  
  return (
    <div className={`doc-viewer level-${level}`}>
      <HeadingTag>{doc.title}</HeadingTag>
      <div className="doc-content">
        {doc.current_content ? (
          doc.current_content.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))
        ) : (
          <p><em>Sem conteúdo para esta seção.</em></p>
        )}
      </div>

      {doc.children && doc.children.length > 0 && (
        <div className="doc-children">
          {doc.children.map(child => (
            <DocViewer key={child.id} doc={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DocViewer;
