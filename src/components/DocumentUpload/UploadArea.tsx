import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

interface UploadAreaProps {
  onFilesAdded: (files: File[]) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFilesAdded }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    }
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-300 ${
        isDragActive ? 'border-soft-gold bg-soft-gold bg-opacity-10' : 'border-light-border hover:border-soft-gold'
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="mx-auto mb-4 text-slate-gray" size={48} />
      {isDragActive ? (
        <p className="text-navy-blue">Drop the files here ...</p>
      ) : (
        <p className="text-slate-gray">Drag 'n' drop some files here, or click to select files</p>
      )}
      <p className="text-sm text-muted-text mt-2">
        Supported formats: PDF, XLSX, CSV, PNG, JPG, GIF
      </p>
    </div>
  );
};

export default UploadArea;

