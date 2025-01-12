import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import DocumentPreview from '../../components/DocumentView/DocumentPreview.tsx';
import MetadataPanel from '../../components/DocumentView/MetadataPanel.tsx';
import AIAnalysisPanel from '../../components/DocumentView/AiAnalysisPanel.tsx';
import AnnotationPanel from '../../components/DocumentView/AnnotationPanel.tsx';
import VersionControlPanel from '../../components/DocumentView/VersionControlPanel.tsx';
import RelatedDocumentsPanel from '../../components/DocumentView/RelatedDocumentsPanel.tsx';
import WorkflowPanel from '../../components/DocumentView/WorkflowPanel.tsx';
import ActivityLogPanel from '../../components/DocumentView/ActivityLogPanel.tsx';
import DocumentActions from '../../components/DocumentView/DocumentActions.tsx';
import { getDummyDocument } from '../../types/documentDetail.ts';

interface DocumentViewProps {
  documentId: string;
  onClose: () => void;
}

const DocumentView: React.FC<DocumentViewProps> = ({ documentId, onClose }) => {
  const [document, setDocument] = useState(getDummyDocument(documentId));
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    // In a real application, you would fetch the document data here
    setDocument(getDummyDocument(documentId));
  }, [documentId]);

  const tabs = [
    { id: 'preview', label: 'Preview' },
    { id: 'metadata', label: 'Metadata' },
    { id: 'ai-analysis', label: 'AI Analysis' },
    { id: 'annotations', label: 'Annotations' },
    { id: 'versions', label: 'Versions' },
    { id: 'related', label: 'Related Docs' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'activity', label: 'Activity Log' },
  ];

  return (
    <div className="fixed inset-0 bg-primary-bg bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-secondary-bg w-full max-w-7xl mx-auto rounded-lg shadow-xl overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-navy-blue text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{document.name}</h1>
            <p className="mt-1 text-sm">{document.type} - {document.size}</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-soft-gold transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="border-b border-light-border">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${
                  activeTab === tab.id
                    ? 'border-soft-gold text-soft-gold'
                    : 'border-transparent text-slate-gray hover:text-dark-text hover:border-slate-gray'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {activeTab === 'preview' && <DocumentPreview document={document} />}
          {activeTab === 'metadata' && <MetadataPanel document={document} />}
          {activeTab === 'ai-analysis' && <AIAnalysisPanel document={document} />}
          {activeTab === 'annotations' && <AnnotationPanel document={document} />}
          {activeTab === 'versions' && <VersionControlPanel document={document} />}
          {activeTab === 'related' && <RelatedDocumentsPanel document={document} />}
          {activeTab === 'workflow' && <WorkflowPanel document={document} />}
          {activeTab === 'activity' && <ActivityLogPanel document={document} />}
        </div>
        <div className="px-4 py-3 bg-primary-bg border-t border-light-border">
          <DocumentActions document={document} />
        </div>
      </div>
    </div>
  );
};

export default DocumentView;

