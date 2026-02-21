import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import type { DocElement } from '../contexts/ProjectContext';
import DocTree from './DocTree';
import DocViewer from './DocViewer';

const DocEditor: React.FC = () => {
  const { selectedProject, docs, addDoc, parseDocHierarchy, importDocHierarchy } = useProject();
  const [selectedDoc, setSelectedDoc] = useState<DocElement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  if (!selectedProject) return null;

  const handleSave = async () => {
    if (title && content) {
      await addDoc(title, content, selectedDoc?.id, parentId);
      setTitle('');
      setContent('');
      setParentId(null);
      setSelectedDoc(null);
      setIsCreating(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const sections = await parseDocHierarchy(file);
        if (confirm(`Deseja importar ${sections.length} seções de documentação?`)) {
          await importDocHierarchy(sections);
        }
      } catch (error) {
        alert("Erro ao importar documentação: " + (error as Error).message);
      }
    }
  };

  const startEditing = (doc: DocElement) => {
    setSelectedDoc(doc);
    setTitle(doc.title);
    setContent(doc.current_content || '');
    setParentId(doc.parent_id || null);
    setIsCreating(true);
    setIsViewing(false);
  };

  const startViewing = (doc: DocElement) => {
    setSelectedDoc(doc);
    setIsViewing(true);
    setIsCreating(false);
  };

  const getAllDocsFlattened = (elements: DocElement[]): DocElement[] => {
    let flattened: DocElement[] = [];
    elements.forEach(el => {
      flattened.push(el);
      if (el.children) {
        flattened = flattened.concat(getAllDocsFlattened(el.children));
      }
    });
    return flattened;
  };

  const flattenedDocs = getAllDocsFlattened(docs);

  return (
    <div className="doc-editor-layout">
      <div className="doc-sidebar">
        <div className="doc-sidebar-header">
          <h3>Documentação</h3>
          <div className="sidebar-actions">
            <button onClick={() => {
              setIsCreating(true);
              setIsViewing(false);
              setSelectedDoc(null);
              setTitle('');
              setContent('');
              setParentId(null);
            }} title="Novo Elemento">+</button>
            <label className="import-btn" title="Importar Documento">
              📁
              <input type="file" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        <div className="doc-tree-container">
          <DocTree 
            docs={docs} 
            onSelect={startViewing} 
            selectedDocId={selectedDoc?.id} 
          />
        </div>
      </div>

      <div className="doc-main">
        {selectedDoc && isViewing ? (
          <div className="viewer-container">
            <div className="viewer-actions">
              <button onClick={() => startEditing(selectedDoc)}>Editar Esta Seção</button>
            </div>
            <DocViewer doc={selectedDoc} />
          </div>
        ) : isCreating ? (
          <div className="editor-container">
            <h3>{selectedDoc ? 'Editar Seção' : 'Nova Seção'}</h3>
            <div className="form-group">
              <label>Título</label>
              <input 
                type="text" 
                placeholder="Título do Elemento" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {!selectedDoc && (
              <div className="form-group">
                <label>Seção Pai (Opcional)</label>
                <select 
                  value={parentId || ''} 
                  onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Nenhuma (Raiz)</option>
                  {flattenedDocs.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.title}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Conteúdo</label>
              <textarea 
                placeholder="Conteúdo da documentação..." 
                value={content} 
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="editor-actions">
              <button onClick={() => { setIsCreating(false); setSelectedDoc(null); }}>Cancelar</button>
              <button className="save-btn" onClick={handleSave}>Salvar</button>
            </div>
          </div>
        ) : (
          <div className="doc-placeholder">
            <p>Selecione uma seção na árvore para visualizar ou crie uma nova.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocEditor;
