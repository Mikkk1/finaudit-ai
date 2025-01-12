export interface UploadedFile {
    id: string;
    file: File;
    progress: number;
    metadata: Record<string, string>;
    status: 'pending' | 'uploading' | 'uploaded' | 'error';
  }
  
  