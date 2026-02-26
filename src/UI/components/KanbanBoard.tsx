import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import type { Task, Phase } from '../contexts/ProjectContext';
import TaskDetailModal from './TaskDetailModal';

const AREAS = {
  jogo: ['Arte', 'Programação', 'Design', 'Som'],
  aplicativo: ['UX', 'Frontend', 'Backend', 'Devops']
};

const KanbanBoard: React.FC = () => {
  const { selectedProject, tasks, phases, docs, addTask, updateTask } = useProject();
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskArea, setNewTaskArea] = useState('');
  const [newTaskDocId, setNewTaskDocId] = useState<number | ''>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Default to the project's current phase when selectedProject changes or phases are loaded
  useEffect(() => {
    if (selectedProject && phases.length > 0) {
      if (selectedProject.current_phase_id) {
        setSelectedPhaseId(selectedProject.current_phase_id);
      } else if (!selectedPhaseId) {
        setSelectedPhaseId(phases[0]?.id||null);
      }
    }
  }, [selectedProject, phases]);

  const filteredTasks = useMemo(() => {
    if (!selectedPhaseId) return tasks;
    return tasks.filter(t => t.phase_id === selectedPhaseId);
  }, [tasks, selectedPhaseId]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Record<string, Task[]>> = {
      todo: {},
      doing: {},
      done: {}
    };

    const taskList = Array.isArray(filteredTasks) ? filteredTasks : [];
    taskList.forEach(task => {
      let group = groups[task.status];
      if (group) {
        if (!group[task.area]) {
          group[task.area] = [];
        }
        group[task.area]!.push(task);
      }
    });

    return groups;
  }, [filteredTasks]);

  if (!selectedProject) return null;

  const projectAreas = AREAS[selectedProject.type as keyof typeof AREAS] || [];

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle && newTaskArea) {
      const doc = docs.find(d => d.id === newTaskDocId);
      await addTask(newTaskTitle, newTaskArea, '', doc?.current_version_id, selectedPhaseId);
      setNewTaskTitle('');
      setNewTaskArea('');
      setNewTaskDocId('');
      setShowAddForm(false);
    }
  };

  const columns: ('todo' | 'doing' | 'done')[] = ['todo', 'doing', 'done'];

  const moveTask = (e: React.MouseEvent, task: Task, newStatus: 'todo' | 'doing' | 'done') => {
    e.stopPropagation(); // Avoid opening the modal when clicking move buttons
    updateTask(task.id, { status: newStatus });
  };

  const toggleGroup = (status: string, area: string) => {
    const key = `${status}-${area}`;
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isCollapsed = (status: string, area: string) => collapsedGroups.has(`${status}-${area}`);

  return (
    <div className="kanban">
      <div className="kanban-header">
        <div className="kanban-title-section">
          <h2>Kanban</h2>
          <div className="phase-selector">
            <label htmlFor="phase-select">Fase:</label>
            <select 
              id="phase-select"
              value={selectedPhaseId || ''} 
              onChange={(e) => setSelectedPhaseId(Number(e.target.value))}
            >
              {phases.map(phase => (
                <option key={phase.id} value={phase.id}>
                  {phase.name} {phase.id === selectedProject.current_phase_id ? '(Atual)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="add-task-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancelar' : '+ Nova Tarefa'}
        </button>
      </div>

      {showAddForm && (
        <form className="add-task-form" onSubmit={handleAddTask}>
          <input 
            type="text" 
            placeholder="Título da tarefa" 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            required
          />
          <select 
            value={newTaskArea} 
            onChange={(e) => setNewTaskArea(e.target.value)}
            required
          >
            <option value="">Selecione a Área</option>
            {projectAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <select 
            value={newTaskDocId} 
            onChange={(e) => setNewTaskDocId(Number(e.target.value))}
          >
            <option value="">Sem Documento</option>
            {docs.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.title}</option>
            ))}
          </select>
          <button type="submit">Adicionar</button>
        </form>
      )}

      <div className="kanban-board">
        {columns.map(status => (
          <div key={status} className={`kanban-column ${status}`}>
            <h3>{status.toUpperCase()}</h3>
            <div className="task-list">
              {Object.entries(groupedTasks[status]!).map(([area, areaTasks]) => (
                <div key={`${status}-${area}`} className="task-group">
                  <div 
                    className="group-header" 
                    onClick={() => toggleGroup(status, area)}
                  >
                    <span className={`collapse-icon ${isCollapsed(status, area) ? 'collapsed' : ''}`}>▼</span>
                    <span className="group-title">{area}</span>
                    <span className="group-count">({areaTasks.length})</span>
                  </div>
                  
                  {!isCollapsed(status, area) && (
                    <div className="group-content">
                      {areaTasks.map(task => (
                        <div 
                          key={task.id} 
                          className="task-card" 
                          onClick={() => setSelectedTaskForModal(task)}
                        >
                          <h4>{task.title}</h4>
                          <p className="task-area">{task.area}</p>
                          <div className="task-actions">
                            {status !== 'todo' && <button onClick={(e) => moveTask(e, task, 'todo')}>Todo</button>}
                            {status !== 'doing' && <button onClick={(e) => moveTask(e, task, 'doing')}>Doing</button>}
                            {status !== 'done' && <button onClick={(e) => moveTask(e, task, 'done')}>Done</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedTaskForModal && (
        <TaskDetailModal 
          task={selectedTaskForModal}
          isOpen={true}
          onClose={() => setSelectedTaskForModal(null)}
        />
      )}
    </div>
  );
};


export default KanbanBoard;
