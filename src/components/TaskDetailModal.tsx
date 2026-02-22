import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import type { Task } from '../contexts/ProjectContext';
import type { ChecklistItem } from '../module/interfaces/Task';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const AREAS = {
  jogo: ['Arte', 'Programação', 'Design', 'Som'],
  aplicativo: ['UX', 'Frontend', 'Backend', 'Devops']
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose }) => {
  const { selectedProject, updateTask, deleteTask } = useProject();
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setEditedTask({ ...task });
  }, [task]);

  if (!isOpen || !selectedProject) return null;

  const projectAreas = AREAS[selectedProject.type as keyof typeof AREAS] || [];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTask(task.id, {
        title: editedTask.title,
        description: editedTask.description,
        area: editedTask.area,
        status: editedTask.status,
        target_date: editedTask.target_date,
        checklists: editedTask.checklists,
      });
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Erro ao salvar tarefa.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      setIsDeleting(true);
      try {
        await deleteTask(task.id);
        onClose();
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Erro ao excluir tarefa.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const checklists: ChecklistItem[] = (() => {
    if (!editedTask.checklists) return [];
    try {
      const parsed = JSON.parse(editedTask.checklists);
      if (Array.isArray(parsed)) {
        // Suporte a legado: se for array de strings, converter
        if (typeof parsed[0] === 'string') {
          return (parsed as string[]).map(s => ({
            text: s.replace(/^\[[ x]\]\s*/, '').trim(),
            completed: s.startsWith('[x]')
          }));
        }
        return parsed;
      }
      return [];
    } catch (e) {
      // Fallback para formato de nova linha (legado antigo)
      return editedTask.checklists.split('\n').map(line => ({
        text: line.replace(/^\[[ x]\]\s*/, '').trim(),
        completed: line.startsWith('[x]')
      })).filter(item => item.text.length > 0);
    }
  })();

  const updateChecklists = (newItems: ChecklistItem[]) => {
    setEditedTask({
      ...editedTask,
      checklists: JSON.stringify(newItems)
    });
  };

  const toggleChecklistItem = (index: number) => {
    const newItems = [...checklists];
    newItems[index]!.completed = !newItems[index]!.completed;
    updateChecklists(newItems);
  };

  const addChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChecklistItem.trim()) {
      const newItems = [...checklists, { text: newChecklistItem.trim(), completed: false }];
      updateChecklists(newItems);
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (index: number) => {
    const newItems = checklists.filter((_, i) => i !== index);
    updateChecklists(newItems);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <input 
            type="text" 
            className="task-title-input"
            value={editedTask.title}
            onChange={e => setEditedTask({ ...editedTask, title: e.target.value })}
          />
          <div className="task-meta">
            <select 
              value={editedTask.area}
              onChange={e => setEditedTask({ ...editedTask, area: e.target.value })}
            >
              {projectAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <select 
              value={editedTask.status}
              onChange={e => setEditedTask({ ...editedTask, status: e.target.value as any })}
            >
              <option value="todo">To Do</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className="modal-body">
          <section className="modal-section">
            <label>Descrição</label>
            <textarea 
              value={editedTask.description || ''}
              onChange={e => setEditedTask({ ...editedTask, description: e.target.value })}
              placeholder="Adicione uma descrição detalhada..."
            />
          </section>

          <section className="modal-section">
            <label>Data de Entrega</label>
            <input 
              type="date" 
              value={editedTask.target_date || ''}
              onChange={e => setEditedTask({ ...editedTask, target_date: e.target.value })}
            />
          </section>

          <section className="modal-section">
            <label>Checklist</label>
            <div className="checklist-container">
              {checklists.map((item, index) => (
                <div key={index} className="checklist-item">
                  <input 
                    type="checkbox" 
                    checked={item.completed} 
                    onChange={() => toggleChecklistItem(index)}
                  />
                  <span className={item.completed ? 'completed' : ''}>{item.text}</span>
                  <button className="remove-item" onClick={() => removeChecklistItem(index)}>×</button>
                </div>
              ))}
              <form onSubmit={addChecklistItem} className="add-checklist-form">
                <input 
                  type="text" 
                  placeholder="Adicionar item..."
                  value={newChecklistItem}
                  onChange={e => setNewChecklistItem(e.target.value)}
                />
                <button type="submit">Adicionar</button>
              </form>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="delete-btn" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Excluindo...' : 'Excluir Tarefa'}
          </button>
          <div className="footer-actions">
            <button className="cancel-btn" onClick={onClose}>Fechar</button>
            <button className="save-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
