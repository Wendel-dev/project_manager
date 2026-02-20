import React, { useEffect, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';

interface GovernanceData {
  nextStep?: { area: string, todo_count: number, done_count: number };
  stalledTasks: { id: number, title: string }[];
  outdatedTasks: { id: number, title: string, doc_title: string }[];
}

const GovernanceAlerts: React.FC = () => {
  const { selectedProject, tasks, docs } = useProject();
  const { token } = useAuth();
  const [govData, setGovData] = useState<GovernanceData | null>(null);

  const fetchGovernance = async () => {
    if (!selectedProject || !token) return;
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/governance`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      setGovData(data);
    } catch (error) {
      console.error("Error fetching governance:", error);
    }
  };

  useEffect(() => {
    fetchGovernance();
    const interval = setInterval(fetchGovernance, 5000); // Poll every 5s for inertia check
    return () => clearInterval(interval);
  }, [selectedProject, tasks, docs, token]);

  if (!govData) return null;

  return (
    <div className="governance-alerts">
      <div className="alert-section">
        <h3>Próximo Passo (Next Step)</h3>
        {govData.nextStep ? (
          <div className="next-step-card">
            <p>Foque em: <strong>{govData.nextStep.area}</strong></p>
            <span>{govData.nextStep.todo_count} tarefas pendentes vs {govData.nextStep.done_count} concluídas</span>
          </div>
        ) : (
          <p>Sem dados suficientes.</p>
        )}
      </div>

      {govData.stalledTasks.length > 0 && (
        <div className="alert-section stalled">
          <h3>Monitor de Inércia (Stalled)</h3>
          <ul>
            {govData.stalledTasks.map(task => (
              <li key={task.id}>⚠️ {task.title} está travada há algum tempo.</li>
            ))}
          </ul>
        </div>
      )}

      {govData.outdatedTasks.length > 0 && (
        <div className="alert-section outdated">
          <h3>Obsolescência</h3>
          <ul>
            {govData.outdatedTasks.map(task => (
              <li key={task.id}>🔄 {task.title} refere-se a uma versão antiga de <strong>{task.doc_title}</strong>.</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GovernanceAlerts;
