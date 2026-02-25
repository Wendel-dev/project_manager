import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import KanbanBoard from './KanbanBoard';
import DocEditor from './DocEditor';
import GovernanceAlerts from './GovernanceAlerts';
import PhaseTransitionModal from './PhaseTransitionModal';
import { ProjectModule } from '../module/Project';

const ProjectDashboard: React.FC = () => {
  const { selectedProject, tasks, phases, createPhase, deleteProject, exportProjectDocs, docs } = useProject();
  const [activeTab, setActiveTab] = useState<'kanban' | 'docs' | 'gov'>('kanban');
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!selectedProject) {
    return (
      <div className="dashboard-empty">
        <h2>Selecione ou crie um projeto para começar</h2>
      </div>
    );
  }

  const currentPhaseData = phases.find(p => p.id === selectedProject.current_phase_id);
  const currentPhaseName = currentPhaseData ? currentPhaseData.name : (selectedProject.current_phase || 'Início');

  const handleDeleteProject = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o projeto "${selectedProject.name}"? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteProject(selectedProject.id);
      } catch (error) {
        alert("Erro ao excluir projeto: " + (error as Error).message);
      }
    }
  };

  const projectPhases = ProjectModule.getPhases(selectedProject.type);
  const currentPhaseIndex = projectPhases.indexOf(currentPhaseName);

  const handleNextPhaseClick = () => {
    // Soft-Gate: Check for unfinished tasks
    const unfinishedTasks = tasks.filter(t => t.status !== 'done').length;
    
    if (unfinishedTasks > 0) {
      setPhaseError(`Não é possível avançar: Existem ${unfinishedTasks} tarefas pendentes.`);
      setTimeout(() => setPhaseError(null), 3000);
      return;
    }

    setIsModalOpen(true);
  };

  const handleConfirmTransition = async (phaseName: string, tasks?: any[]) => {
    try {
      await createPhase(selectedProject.id, phaseName, tasks);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error in phase creation:", error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-top">
          <div className="header-title-container">
            <h1>{selectedProject.name}</h1>
            <div className="header-actions">
              {activeTab === 'docs' && (
                <button 
                  className="export-docs-btn" 
                  onClick={exportProjectDocs}
                  disabled={docs.length === 0}
                >
                  Exportar Documentação (.md)
                </button>
              )}
              <button className="delete-project-btn" onClick={handleDeleteProject}>Excluir Projeto</button>
            </div>
          </div>
          <div className="phase-progression">
            <span>Fase: <strong>{currentPhaseName}</strong></span>
            <button className="next-phase-btn" onClick={handleNextPhaseClick}>Próxima Fase</button>
          </div>
        </div>
        {phaseError && <div className="phase-error">{phaseError}</div>}
        <div className="project-meta">
          <p><strong>Tipo:</strong> {selectedProject.type}</p>
        </div>
      </header>

      <div className="dashboard-tabs">
        <div 
          className={`tab ${activeTab === 'kanban' ? 'active' : ''}`}
          onClick={() => setActiveTab('kanban')}
        >
          Kanban
        </div>
        <div 
          className={`tab ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          Documentação
        </div>
        <div 
          className={`tab ${activeTab === 'gov' ? 'active' : ''}`}
          onClick={() => setActiveTab('gov')}
        >
          Governança
        </div>
      </div>

      <section className="dashboard-content">
        {activeTab === 'kanban' && <KanbanBoard />}
        {activeTab === 'docs' && <DocEditor />}
        {activeTab === 'gov' && <GovernanceAlerts />}
      </section>

      <PhaseTransitionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmTransition}
        projectType={selectedProject.type}
        currentPhase={currentPhaseName}
      />
    </div>
  );
};

export default ProjectDashboard;
