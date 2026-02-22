import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { PHASES } from '../module/Project';
import FileUpload from './FileUpload';
import ImportPreview from './ImportPreview';
import type { ParsedPhase } from '../module/interfaces/ParsedProject';
import type { ProjectType } from '../module/interfaces/Project';

interface PhaseTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (phaseName: string, tasks?: ParsedPhase['tasks']) => Promise<void>;
  projectType: ProjectType;
  currentPhase: string;
}

const PhaseTransitionModal: React.FC<PhaseTransitionModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  projectType,
  currentPhase 
}) => {
  const { parseDocument } = useProject();
  const [mode, setMode] = useState<'choice' | 'manual' | 'import'>('choice');
  const [manualPhase, setManualPhase] = useState('');
  const [parsedData, setParsedData] = useState<ParsedPhase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const suggestions = PHASES[projectType] || [];
  const nextSuggestedPhase = suggestions[suggestions.indexOf(currentPhase) + 1] || '';

  const handleManualSubmit = async () => {
    const finalPhase = manualPhase || nextSuggestedPhase;
    if (!finalPhase) return;
    setIsSubmitting(true);
    try {
      await onConfirm(finalPhase);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      const parsed = await parseDocument(file);
      // For transition, we might want the 'type' to be the phase name
      setParsedData(parsed);
    } catch (err) {
      alert("Erro ao processar arquivo: " + (err as Error).message);
    }
  };

  const handleConfirmImport = async (project: ParsedPhase) => {
    setIsSubmitting(true);
    try {
      await onConfirm(project.name, project.tasks);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content transition-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        {mode === 'choice' && (
          <div className="transition-choice">
            <h2>Próxima Fase</h2>
            <p>Como deseja configurar a próxima fase do projeto?</p>
            <div className="choice-buttons">
              <button className="choice-btn" onClick={() => { setMode('import'); setParsedData(null); }}>
                <span className="icon">📄</span>
                <strong>Com Especificação</strong>
                <span>Importar tarefas e metadados de um arquivo</span>
              </button>
              <button className="choice-btn" onClick={() => { setMode('manual'); setManualPhase(nextSuggestedPhase); }}>
                <span className="icon">✍️</span>
                <strong>Sem Especificação (Manual)</strong>
                <span>Definir apenas o nome da fase</span>
              </button>
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div className="manual-transition">
            <h2>Configuração Manual</h2>
            <div className="form-group">
              <label>Nome da Próxima Fase:</label>
              <input 
                type="text" 
                list="phase-suggestions" 
                value={manualPhase} 
                onChange={(e) => setManualPhase(e.target.value)}
                placeholder="Ex: Produção, MVP..."
              />
              <datalist id="phase-suggestions">
                {suggestions.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="modal-actions">
              <button className="back-btn" onClick={() => setMode('choice')}>Voltar</button>
              <button 
                className="confirm-btn" 
                onClick={handleManualSubmit}
                disabled={!manualPhase && !nextSuggestedPhase || isSubmitting}
              >
                {isSubmitting ? 'Confirmando...' : 'Confirmar Transição'}
              </button>
            </div>
          </div>
        )}

        {mode === 'import' && (
          <div className="import-transition">
            {!parsedData ? (
              <>
                <h2>Importar Especificação</h2>
                <FileUpload onFileSelect={handleFileSelect} />
                <button className="back-btn" onClick={() => setMode('choice')}>Voltar</button>
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
        )}
      </div>
    </div>
  );
};

export default PhaseTransitionModal;
