import React from 'react';
import { X } from 'lucide-react';
import { UploadedFile } from '../../types/documentUpload.ts';

interface PreviewModalProps {
  file: UploadedFile;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ file, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-secondary-bg rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-navy-blue">{file.file.name}</h2>
          <button onClick={onClose} className="text-slate-gray hover:text-navy-blue">
            <X size={24} />
          </button>
        </div>
        <div className="bg-primary-bg rounded-lg p-4">
          {file.file.type.startsWith('image/') ? (
            <img src={URL.createObjectURL(file.file)} alt={file.file.name} className="max-w-full h-auto" />
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-gray">Preview not available for this file type.</p>
              <p className="text-sm text-muted-text mt-2">File type: {file.file.type}</p>
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-navy-blue mb-2">Metadata</h3>
          <ul className="space-y-2">
            {Object.entries(file.metadata).map(([key, value]) => (
              <li key={key} className="flex">
                <span className="font-medium text-slate-gray w-1/3">{key}:</span>
                <span className="text-dark-text">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;

