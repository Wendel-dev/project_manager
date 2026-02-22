import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import type { Task } from '../contexts/ProjectContext';
import TaskDetailModal from './TaskDetailModal';

const AREAS = {
  jogo: ['Arte', 'Programação', 'Design', 'Som'],
  aplicativo: ['UX', 'Frontend', 'Backend', 'Devops']
};

const KanbanBoard: React.FC = () => {
  const { selectedProject, tasks, docs, addTask, updateTask } = useProject();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskArea, setNewTaskArea] = useState('');
  const [newTaskDocId, setNewTaskDocId] = useState<number | ''>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  if (!selectedProject) return null;

  const projectAreas = AREAS[selectedProject.type as keyof typeof AREAS] || [];

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle && newTaskArea) {
      const doc = docs.find(d => d.id === newTaskDocId);
      await addTask(newTaskTitle, newTaskArea, '', doc?.current_version_id);
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

  return (
    <div className="kanban">
      <div className="kanban-header">
        <h2>Kanban</h2>
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
              {(Array.isArray(tasks) ? tasks : []).filter(t => t.status === status).map(task => (
                <div key={task.id} className="task-card" onClick={() => setSelectedTaskForModal(task)}>
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
