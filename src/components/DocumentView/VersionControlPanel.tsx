import React, { useState } from 'react';
import { GitBranch, ArrowLeft, ArrowRight, Clock, GitCommit } from 'lucide-react';

interface DocumentVersion {
  id: number;
  version_number: number;
  content: string;
  created_at: string;
}

interface VersionControlPanelProps {
  document: {
    versions: DocumentVersion[];
  };
}

const VersionControlPanel: React.FC<VersionControlPanelProps> = ({ document }) => {
  // Initialize state unconditionally at the top level
  const [currentVersion, setCurrentVersion] = useState<DocumentVersion | null>(
    document.versions.length > 0 ? document.versions[0] : null
  );

  // Handle empty versions
  if (!document.versions || document.versions.length === 0) {
    return (
      <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <GitBranch className="mr-2 h-5 w-5" />
            Version History
          </h3>
        </div>
        <div className="p-6 text-center text-slate-gray">
          No versions available for this document.
        </div>
      </div>
    );
  }

  const navigateVersion = (direction: 'prev' | 'next') => {
    if (!currentVersion) return; // Guard clause if currentVersion is null
    const currentIndex = document.versions.findIndex(v => v.id === currentVersion.id);
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentVersion(document.versions[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < document.versions.length - 1) {
      setCurrentVersion(document.versions[currentIndex + 1]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Version Navigation Card */}
      <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <GitBranch className="mr-2 h-5 w-5" />
            Version History
          </h3>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateVersion('prev')}
              disabled={currentVersion?.id === document.versions[0].id}
              className="p-2 rounded-lg bg-primary-bg text-navy-blue hover:bg-hover-state disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="text-center px-4">
              <div className="flex items-center justify-center space-x-2">
                <GitCommit className="h-5 w-5 text-soft-gold" />
                <span className="text-lg font-semibold text-dark-text">
                  Version {currentVersion?.version_number}
                </span>
              </div>
              <div className="flex items-center justify-center mt-2 text-muted-text">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {currentVersion && new Date(currentVersion.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigateVersion('next')}
              disabled={currentVersion?.id === document.versions[document.versions.length - 1].id}
              className="p-2 rounded-lg bg-primary-bg text-navy-blue hover:bg-hover-state disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Changes Card */}
      <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-dark-text mb-4">Changes in this version</h3>
          <ul className="space-y-3">
            {currentVersion?.content.split('\n').map((change, index) => (
              <li 
                key={index} 
                className="flex items-start"
              >
                <div className="mt-1.5 h-2 w-2 rounded-full bg-soft-gold mr-3" />
                <span className="text-slate-gray">{change}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button className="bg-gradient-to-r from-[#003366] to-[#004D99] text-white px-6 py-3 rounded-lg flex items-center transform transition-transform duration-200 hover:scale-105 hover:shadow-lg">
          <GitBranch className="h-5 w-5 mr-2" />
          Create New Version
        </button>
      </div>
    </div>
  );
};

export default VersionControlPanel;