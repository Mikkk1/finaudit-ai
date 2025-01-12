import React, { useState } from 'react';
import { UploadedFile } from '../../types/documentUpload.ts';

interface MetadataFormProps {
  files: UploadedFile[];
  onMetadataChange: (fileId: string, metadata: Record<string, string>) => void;
}

const MetadataForm: React.FC<MetadataFormProps> = ({ files, onMetadataChange }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
    setMetadata(files.find(f => f.id === fileId)?.metadata || {});
  };

  const handleMetadataChange = (key: string, value: string) => {
    const updatedMetadata = { ...metadata, [key]: value };
    setMetadata(updatedMetadata);
    if (selectedFile) {
      onMetadataChange(selectedFile, updatedMetadata);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-navy-blue mb-4">Add Metadata</h2>
      <div className="flex space-x-4">
        <select
          value={selectedFile || ''}
          onChange={(e) => handleFileSelect(e.target.value)}
          className="p-2 border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-soft-gold"
        >
          <option value="">Select a file</option>
          {files.map(file => (
            <option key={file.id} value={file.id}>{file.file.name}</option>
          ))}
        </select>
        {selectedFile && (
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-gray mb-1">Document Type</label>
              <input
                type="text"
                value={metadata.documentType || ''}
                onChange={(e) => handleMetadataChange('documentType', e.target.value)}
                className="w-full p-2 border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-soft-gold"
                placeholder="e.g., Invoice, Report, Contract"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-gray mb-1">Fiscal Year</label>
              <input
                type="text"
                value={metadata.fiscalYear || ''}
                onChange={(e) => handleMetadataChange('fiscalYear', e.target.value)}
                className="w-full p-2 border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-soft-gold"
                placeholder="e.g., 2023"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-gray mb-1">Department</label>
              <input
                type="text"
                value={metadata.department || ''}
                onChange={(e) => handleMetadataChange('department', e.target.value)}
                className="w-full p-2 border border-light-border rounded-md focus:outline-none focus:ring-2 focus:ring-soft-gold"
                placeholder="e.g., Finance, HR, Operations"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetadataForm;

