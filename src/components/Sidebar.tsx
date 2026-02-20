import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectType } from '../module/interfaces/Project';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { projects, selectedProject, selectProject, addProject } = useProject();
  const { user, logout } = useAuth();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('jogo');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName) {
      await addProject(newProjectName, newProjectType);
      setNewProjectName('');
      onClose();
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
              <button className="logout-btn-desktop" onClick={logout}>Sair</button>
            </div>
          )}
        </div>
      
      <div className="new-project-form">
        <h3>Novo Projeto</h3>
        <form onSubmit={handleSubmit}>
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
          <button type="submit">Criar</button>
        </form>
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
