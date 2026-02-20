import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import type { DocElement } from '../contexts/ProjectContext';

const DocEditor: React.FC = () => {
  const { selectedProject, docs, addDoc } = useProject();
  const [selectedDoc, setSelectedDoc] = useState<DocElement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!selectedProject) return null;

  const handleSave = async () => {
    if (title && content) {
      await addDoc(title, content, selectedDoc?.id);
      setTitle('');
      setContent('');
      setSelectedDoc(null);
      setIsCreating(false);
    }
  };

  const startEditing = (doc: DocElement) => {
    setSelectedDoc(doc);
    setTitle(doc.title);
    setContent(doc.current_content || '');
    setIsCreating(true);
  };

  return (
    <div className="doc-editor">
      <div className="doc-sidebar">
        <div className="doc-sidebar-header">
          <h3>Documentação</h3>
          <button onClick={() => {
            setIsCreating(true);
            setSelectedDoc(null);
            setTitle('');
            setContent('');
          }}>+ Novo</button>
        </div>
        <ul className="doc-list">
          {docs.map(doc => (
            <li 
              key={doc.id} 
              className={selectedDoc?.id === doc.id ? 'active' : ''}
              onClick={() => startEditing(doc)}
            >
              {doc.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="doc-main">
        {isCreating ? (
          <div className="editor-container">
            <input 
              type="text" 
              placeholder="Título do Elemento" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              disabled={!!selectedDoc}
            />
            <textarea 
              placeholder="Conteúdo da documentação..." 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="editor-actions">
              <button onClick={() => setIsCreating(false)}>Cancelar</button>
              <button className="save-btn" onClick={handleSave}>Salvar Versão</button>
            </div>
          </div>
        ) : (
          <div className="doc-placeholder">
            <p>Selecione um elemento para visualizar ou editar, ou crie um novo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocEditor;
