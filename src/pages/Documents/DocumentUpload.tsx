import React, { useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import UploadArea from '../../components/DocumentUpload/UploadArea.tsx';
import FileList from '../../components/DocumentUpload/FileList.tsx';
import MetadataForm from '../../components/DocumentUpload/MetaDataForm.tsx';
import UploadProgress from '../../components/DocumentUpload/UploadProgress.tsx';
import PreviewModal from '../../components/DocumentUpload/PreviewModal.tsx';
import { UploadedFile } from '../../types/documentUpload.tsx';

const DocumentUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const handleFilesAdded = (newFiles: File[]) => {
    const updatedFiles = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      metadata: {},
      status: 'pending',
    }));
    setFiles(prevFiles => [...prevFiles, ...updatedFiles]);
  };

  const handleUpload = async () => {
    setUploading(true);
    // Simulate upload process
    for (let file of files) {
      if (file.status === 'pending') {
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setFiles(prevFiles =>
            prevFiles.map(f =>
              f.id === file.id ? { ...f, progress: i } : f
            )
          );
        }
        setFiles(prevFiles =>
          prevFiles.map(f =>
            f.id === file.id ? { ...f, status: 'uploaded' } : f
          )
        );
      }
    }
    setUploading(false);
  };

  const handleMetadataChange = (fileId: string, metadata: Record<string, string>) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId ? { ...file, metadata } : file
      )
    );
  };

  const handlePreview = (file: UploadedFile) => {
    setPreviewFile(file);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  return (
    <div className="min-h-screen bg-primary-bg p-8">
      <div className="max-w-4xl mx-auto bg-secondary-bg rounded-lg shadow-card p-8">
        <h1 className="text-3xl font-bold text-navy-blue mb-6">Document Upload</h1>
        
        <UploadArea onFilesAdded={handleFilesAdded} />
        
        {files.length > 0 && (
          <>
            <FileList 
              files={files} 
              onPreview={handlePreview}
              onMetadataChange={handleMetadataChange}
            />
            <MetadataForm files={files} onMetadataChange={handleMetadataChange} />
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading || files.every(f => f.status === 'uploaded')}
                className="bg-navy-blue text-white px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors duration-300 flex items-center"
              >
                <UploadCloud className="mr-2" />
                {uploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
            {uploading && <UploadProgress files={files} />}
          </>
        )}
        
        {files.length === 0 && (
          <div className="text-center text-slate-gray mt-8">
            <AlertCircle className="mx-auto mb-4" size={48} />
            <p>No files selected. Drag and drop files or use the upload button above.</p>
          </div>
        )}
      </div>
      
      {previewFile && (
        <PreviewModal file={previewFile} onClose={handleClosePreview} />
      )}
    </div>
  );
};

export default DocumentUpload;

