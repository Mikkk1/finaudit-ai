import React, { useState, useEffect, useCallback } from 'react';
import { File, CheckCircle, Download, Edit2, Share2, Info, Trash2 } from 'lucide-react';
import { Document } from '../../types/documentUpload.ts';

interface DocumentGridProps {
  documents: Document[];
  selectedDocuments: string[];
  onToggleSelection: (id: string) => void;
  onOpenDocument: (id: string) => void;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({ 
  documents, 
  selectedDocuments, 
  onToggleSelection,
  onOpenDocument
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; docId: string } | null>(null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, docId });
  }, []);

  const handleAction = useCallback((action: string) => {
    if (contextMenu) {
      console.log(`Performing ${action} on document ${contextMenu.docId}`);
      // Implement the action here
    }
    setContextMenu(null);
  }, [contextMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu && !(event.target as Element).closest('.context-menu')) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {documents.map(doc => (
        <div 
          key={doc.id} 
          className="group relative bg-white rounded-xl shadow-card hover:shadow-lg 
            border border-light-border transition-all duration-300 hover:border-navy-blue/20 cursor-pointer"
          onContextMenu={(e) => handleContextMenu(e, doc.id)}
          onClick={() => onOpenDocument(doc.id)}
        >
          {/* Selection Button */}
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={() => onToggleSelection(doc.id)}
              className={`p-1.5 rounded-full transition-all duration-300 
                ${selectedDocuments.includes(doc.id) 
                  ? 'bg-success-green text-white' 
                  : 'bg-slate-gray/10 text-slate-gray hover:bg-navy-blue/10 hover:text-navy-blue'
                }`}
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Document Content */}
          <div className="p-6">
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div className="mb-4 relative">
                <div className="w-16 h-16 flex items-center justify-center bg-primary-bg rounded-2xl 
                  transition-transform duration-300 group-hover:scale-110">
                  <File className="w-8 h-8 text-navy-blue" />
                </div>
              </div>

              {/* Document Info */}
              <h3 className="text-dark-text font-semibold text-center mb-2 line-clamp-1">
                {doc.name}
              </h3>
              <p className="text-sm text-slate-gray mb-1">
                {doc.type} • {doc.size}
              </p>
              <p className="text-xs text-muted-text">
                {formatDate(doc.uploadDate)}
              </p>
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 rounded-xl bg-navy-blue/5 opacity-0 
            group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      ))}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-white shadow-lg rounded-lg py-2 w-48 context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={() => handleAction('download')} className="w-full text-left px-4 py-2 hover:bg-hover-state flex items-center">
            <Download className="w-4 h-4 mr-2" /> Download
          </button>
          <button onClick={() => handleAction('rename')} className="w-full text-left px-4 py-2 hover:bg-hover-state flex items-center">
            <Edit2 className="w-4 h-4 mr-2" /> Rename
          </button>
          <button onClick={() => handleAction('share')} className="w-full text-left px-4 py-2 hover:bg-hover-state flex items-center">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </button>
          <button onClick={() => handleAction('info')} className="w-full text-left px-4 py-2 hover:bg-hover-state flex items-center">
            <Info className="w-4 h-4 mr-2" /> File Information
          </button>
          <button onClick={() => handleAction('delete')} className="w-full text-left px-4 py-2 hover:bg-hover-state flex items-center text-error-red">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentGrid;
