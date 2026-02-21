import React, { useState } from 'react';
import { ParsedProject, ParsedTask } from '../module/interfaces/ParsedProject';

interface ImportPreviewProps {
  parsedProject: ParsedProject;
  onConfirm: (finalProject: ParsedProject) => void;
  onCancel: () => void;
}

const ImportPreview: React.FC<ImportPreviewProps> = ({ parsedProject, onConfirm, onCancel }) => {
  const [project, setProject] = useState<ParsedProject>(parsedProject);

  const handleTaskChange = (index: number, field: keyof ParsedTask, value: any) => {
    const newTasks = [...project.tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setProject({ ...project, tasks: newTasks });
  };

  return (
    <div className="import-preview">
      <h3>Visualização da Importação</h3>
      <div className="project-preview-header">
        <label>Nome do Projeto:</label>
        <input 
          type="text" 
          value={project.name} 
          onChange={(e) => setProject({ ...project, name: e.target.value })} 
        />
        <label>Tipo:</label>
        <select 
          value={project.type} 
          onChange={(e) => setProject({ ...project, type: e.target.value })}
        >
          <option value="jogo">Jogo</option>
          <option value="aplicativo">Aplicativo</option>
        </select>
      </div>

      <div className="tasks-preview-list">
        <h4>Tarefas ({project.tasks.length})</h4>
        {project.tasks.map((task, index) => (
          <div key={index} className="task-preview-item">
            <input 
              type="text" 
              value={task.title} 
              placeholder="Título"
              onChange={(e) => handleTaskChange(index, 'title', e.target.value)} 
            />
            <input 
              type="text" 
              value={task.area || ''} 
              placeholder="Área (ex: Arte, Dev)"
              onChange={(e) => handleTaskChange(index, 'area', e.target.value)} 
            />
            <textarea 
              value={task.description} 
              placeholder="Descrição"
              onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
            />
            <div className="task-extra-info">
              {task.targetDate !== undefined && (
                <div className="date-input">
                  <label>Data Alvo:</label>
                  <input 
                    type="date" 
                    value={task.targetDate} 
                    onChange={(e) => handleTaskChange(index, 'targetDate', e.target.value)}
                  />
                </div>
              )}
              {task.checklists.length > 0 && (
                <div className="checklist-preview">
                  <span>{task.checklists.length} itens de checklist</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="preview-actions">
        <button className="confirm-btn" onClick={() => onConfirm(project)}>Confirmar Importação</button>
        <button className="cancel-btn" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
};

export default ImportPreview;
