import React from 'react';
import { File, Trash2, Eye } from 'lucide-react';
import { UploadedFile } from '../../types/documentUpload.ts';

interface FileListProps {
  files: UploadedFile[];
  onPreview: (file: UploadedFile) => void;
  onMetadataChange: (fileId: string, metadata: Record<string, string>) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onPreview, onMetadataChange }) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-navy-blue mb-4">Uploaded Files</h2>
      <ul className="space-y-4">
        {files.map(file => (
          <li key={file.id} className="bg-hover-state rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <File className="text-slate-gray mr-3" size={24} />
              <div>
                <p className="font-medium text-dark-text">{file.file.name}</p>
                <p className="text-sm text-muted-text">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPreview(file)}
                className="p-2 text-slate-gray hover:text-navy-blue transition-colors duration-200"
              >
                <Eye size={20} />
              </button>
              <button
                onClick={() => {
                  // Implement delete functionality
                  console.log('Delete file:', file.id);
                }}
                className="p-2 text-slate-gray hover:text-error-red transition-colors duration-200"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileList;

