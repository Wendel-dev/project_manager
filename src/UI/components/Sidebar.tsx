import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { ProjectModule } from '../../Project/module/Project';
import type { ProjectType } from '../../Project/module/interfaces/Project';
import type { ParsedPhase } from '../../Project/module/interfaces/ParsedProject';
import FileUpload from './FileUpload';
import ImportPreview from './ImportPreview';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { projects, selectedProject, selectProject, addProject, parseDocument } = useProject();
  const { user, signOut } = useAuth();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('jogo');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  const [creationStep, setCreationStep] = useState<'basic' | 'choice' | 'manual' | 'import'>('basic');
  const [manualPhase, setManualPhase] = useState('');
  const [parsedData, setParsedData] = useState<ParsedPhase | null>(null);

  const resetForm = () => {
    setNewProjectName('');
    setNewProjectType('jogo');
    setCreationStep('basic');
    setManualPhase('');
    setParsedData(null);
  };

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName) {
      setCreationStep('choice');
    }
  };

  const handleManualCreate = async () => {
    const suggestions = ProjectModule.getPhases(newProjectType);
    const finalPhase = manualPhase || suggestions[0];
    await addProject(newProjectName, newProjectType, finalPhase);
    resetForm();
    onClose();
  };

  const handleFileSelect = async (file: File) => {
    try {
      const parsed = await parseDocument(file);
      setParsedData(parsed);
    } catch (err) {
      alert("Erro ao processar arquivo: " + (err as Error).message);
    }
  };

  const handleConfirmImport = async (project: ParsedPhase) => {
    try {
      // Use addProject with the user-defined name/type and the document's phase name
      await addProject(newProjectName, newProjectType, project.name, project.tasks);
      resetForm();
      onClose();
    } catch (err) {
      alert("Erro ao importar: " + (err as Error).message);
    }
  };

  const handleSelect = (id: number) => {
    selectProject(id);
    onClose();
  };

  const toggleGroup = (type: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Group projects by type
  const groupedProjects = projects.reduce((acc, project) => {
    const type = project.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(project);
    return acc;
  }, {} as Record<string, typeof projects>);

  const typeLabels: Record<string, string> = {
    jogo: 'Jogos',
    aplicativo: 'Aplicativos'
  };

  return (
    <>
      {isOpen && <div className="mobile-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={onClose}>×</button>
        <div className="sidebar-header">
          <h2>IndieFlow</h2>
          {user && (
            <div className="user-info">
              <span>{user.email}</span>
              <button className="logout-btn-desktop" onClick={signOut}>Sair</button>
            </div>
          )}
        </div>
      
      <div className="new-project-form">
        <h3>Novo Projeto</h3>
        
        {creationStep === 'basic' && (
          <form onSubmit={handleBasicSubmit}>
            <input 
              type="text" 
              placeholder="Nome do projeto" 
              value={newProjectName} 
              onChange={(e) => setNewProjectName(e.target.value)} 
              required 
            />
            <select 
              value={newProjectType} 
              onChange={(e) => setNewProjectType(e.target.value as ProjectType)}
            >
              <option value="jogo">Jogo</option>
              <option value="aplicativo">Aplicativo</option>
            </select>
            <button type="submit">Continuar</button>
          </form>
        )}

        {creationStep === 'choice' && (
          <div className="creation-choice">
            <p>Configuração inicial:</p>
            <button onClick={() => setCreationStep('import')}>Importar Especificação</button>
            <button onClick={() => {
              setCreationStep('manual');
              setManualPhase(ProjectModule.getInitialPhase(newProjectType));
            }}>Iniciar Vazio</button>
            <button className="cancel-btn-small" onClick={() => setCreationStep('basic')}>Voltar</button>
          </div>
        )}

        {creationStep === 'manual' && (
          <div className="manual-setup">
            <label>Fase Inicial:</label>
            <input 
              type="text" 
              list="initial-phase-suggestions"
              value={manualPhase} 
              onChange={(e) => setManualPhase(e.target.value)}
            />
            <datalist id="initial-phase-suggestions">
              {ProjectModule.getPhases(newProjectType).map(p => <option key={p} value={p} />)}
            </datalist>
            <div className="actions">
              <button onClick={handleManualCreate}>Criar Projeto</button>
              <button className="cancel-btn-small" onClick={() => setCreationStep('choice')}>Voltar</button>
            </div>
          </div>
        )}

        {creationStep === 'import' && (
          <div className="import-setup-overlay">
             <div className="import-setup-modal">
                <button className="close-import" onClick={() => setCreationStep('choice')}>×</button>
                {!parsedData ? (
                  <>
                    <h3>Importar Especificação</h3>
                    <FileUpload onFileSelect={handleFileSelect} />
                  </>
                ) : (
                  <div className="import-preview-container">
                    <div className="phase-name-edit">
                      <label>Nome da Fase Extraído:</label>
                      <input 
                        type="text" 
                        value={parsedData.name} 
                        onChange={(e) => setParsedData({...parsedData, name: e.target.value})}
                      />
                    </div>
                    <ImportPreview 
                      parsedProject={parsedData} 
                      onConfirm={handleConfirmImport}
                      onCancel={() => setParsedData(null)}
                      hideProjectFields={true}
                    />
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      <nav className="project-list">
        {Object.entries(groupedProjects).map(([type, typeProjects]) => (
          <div key={type} className="project-type-group">
            <div 
              className="project-type-header-container" 
              onClick={() => toggleGroup(type)}
            >
              <h3 className="project-type-header">
                {typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1)}
              </h3>
              <span className={`collapse-icon ${collapsedGroups[type] ? 'collapsed' : ''}`}>
                ▼
              </span>
            </div>
            {!collapsedGroups[type] && (
              <ul>
                {typeProjects.map((project) => (
                  <li 
                    key={project.id} 
                    className={selectedProject?.id === project.id ? 'active' : ''}
                    onClick={() => handleSelect(project.id)}
                  >
                    {project.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {projects.length === 0 && <h3 className="project-type-header">Nenhum Projeto</h3>}
      </nav>
    </aside>
    </>
  );
};

export default Sidebar;
