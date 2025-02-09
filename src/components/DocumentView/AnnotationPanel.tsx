import React, { useState } from 'react';
import { MessageSquare, Trash2, Send, User, Clock } from 'lucide-react';

interface Annotation {
  id: number;
  text: string;
  user: string;
  timestamp?: Date;
}

interface AnnotationPanelProps {
  document: {
    annotations: Annotation[];
  };
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({ document }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>(
    document.annotations.map(a => ({
      ...a,
      timestamp: a.timestamp || new Date()
    }))
  );
  const [newAnnotation, setNewAnnotation] = useState('');

  const addAnnotation = () => {
    if (newAnnotation.trim()) {
      setAnnotations([
        {
          id: Date.now(),
          text: newAnnotation.trim(),
          user: 'Current User',
          timestamp: new Date()
        },
        ...annotations
      ]);
      setNewAnnotation('');
    }
  };

  const deleteAnnotation = (id: number) => {
    setAnnotations(annotations.filter(annotation => annotation.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addAnnotation();
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-blue to-[#004D99] p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="text-white" size={20} />
          <h3 className="text-lg font-semibold text-white">Annotations</h3>
        </div>
        <span className="text-sm bg-white bg-opacity-20 text-white px-3 py-1 rounded-full">
          {annotations.length} notes
        </span>
      </div>

      {/* Input Area */}
      <div className="relative">
        <textarea
          value={newAnnotation}
          onChange={(e) => setNewAnnotation(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Add a new annotation..."
          className="w-full px-4 py-3 pr-12 bg-secondary-bg border border-light-border rounded-xl focus:ring-2 focus:ring-navy-blue focus:border-navy-blue placeholder:text-muted-text resize-none min-h-[80px]"
        />
        <button
          onClick={addAnnotation}
          disabled={!newAnnotation.trim()}
          className="absolute right-3 bottom-3 p-2 text-navy-blue hover:bg-primary-bg rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Annotations List */}
      <div className="space-y-4">
        {annotations.length > 0 ? (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className="group bg-secondary-bg border border-light-border p-4 rounded-xl hover:border-navy-blue transition-colors duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-bg rounded-lg">
                    <User size={16} className="text-navy-blue" />
                  </div>
                  <div>
                    <span className="font-medium text-dark-text">{annotation.user}</span>
                    <div className="flex items-center mt-1 text-sm text-muted-text">
                      <Clock size={12} className="mr-1" />
                      {formatTimestamp(annotation.timestamp!)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteAnnotation(annotation.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-error-red hover:bg-error-red hover:bg-opacity-10 rounded-lg transition-all duration-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="mt-3 text-slate-gray whitespace-pre-wrap">
                {annotation.text}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-text mb-3" />
            <p className="text-dark-text font-medium">No annotations yet</p>
            <p className="text-sm text-muted-text mt-1">
              Start adding annotations to this document
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotationPanel;