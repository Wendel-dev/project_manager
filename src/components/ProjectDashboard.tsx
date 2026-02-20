import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import KanbanBoard from './KanbanBoard';
import DocEditor from './DocEditor';
import GovernanceAlerts from './GovernanceAlerts';

const PHASES = {
  jogo: ['Concepção', 'Pré-produção', 'Produção', 'Polimento', 'Lançamento'],
  aplicativo: ['Pesquisa UX', 'MVP', 'Beta', 'Escalamento', 'Manutenção']
};

const ProjectDashboard: React.FC = () => {
  const { selectedProject, tasks, fetchProjects } = useProject();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'kanban' | 'docs' | 'gov'>('kanban');
  const [phaseError, setPhaseError] = useState<string | null>(null);

  if (!selectedProject) {
    return (
      <div className="dashboard-empty">
        <h2>Selecione ou crie um projeto para começar</h2>
      </div>
    );
  }

  const projectPhases = PHASES[selectedProject.type as keyof typeof PHASES];
  const currentPhaseIndex = projectPhases.indexOf(selectedProject.current_phase);

  const handleNextPhase = async () => {
    // Soft-Gate: Check for unfinished tasks
    const unfinishedTasks = tasks.filter(t => t.status !== 'done').length;
    
    if (unfinishedTasks > 0) {
      setPhaseError(`Não é possível avançar: Existem ${unfinishedTasks} tarefas pendentes.`);
      setTimeout(() => setPhaseError(null), 3000);
      return;
    }

    if (currentPhaseIndex < projectPhases.length - 1) {
      const nextPhase = projectPhases[currentPhaseIndex + 1];
      try {
        const response = await fetch(`/api/projects/${selectedProject.id}`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ current_phase: nextPhase }),
        });
        if (response.ok) {
          await fetchProjects();
          // We might need to refresh selected project state here
          // For now, let's keep it simple
        }
      } catch (error) {
        console.error("Error updating phase:", error);
      }
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-top">
          <h1>{selectedProject.name}</h1>
          <div className="phase-progression">
            <span>Fase: <strong>{selectedProject.current_phase}</strong></span>
            {currentPhaseIndex < projectPhases.length - 1 && (
              <button className="next-phase-btn" onClick={handleNextPhase}>Próxima Fase</button>
            )}
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
    </div>
  );
};

export default ProjectDashboard;
