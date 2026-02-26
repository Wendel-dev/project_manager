import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    onFileSelect(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div 
      className={`file-upload ${isDragging ? 'dragging' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input 
        type="file" 
        id="fileInput" 
        style={{ display: 'none' }} 
        onChange={(e) => {
          let file = e.target.files?.[0];
          if(file)
            handleFile(file)
        }}
        accept=".md,.txt,.pdf"
      />
      <label htmlFor="fileInput" className="file-upload-label">
        <span className="icon">📄</span>
        <p>Arraste um arquivo (.md, .txt, .pdf) ou clique para selecionar</p>
      </label>
    </div>
  );
};

export default FileUpload;
