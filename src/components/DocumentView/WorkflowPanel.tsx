import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

const WorkflowPanel = ({ document }) => {
  const workflowSteps = [
    { id: 1, name: 'Upload', status: 'complete' },
    { id: 2, name: 'Review', status: 'current' },
    { id: 3, name: 'Approve', status: 'upcoming' },
    { id: 4, name: 'Finalize', status: 'upcoming' },
  ];

  const getStatusStyles = (status) => {
    switch (status) {
      case 'complete':
        return {
          icon: <CheckCircle className="h-6 w-6 text-success-green" />,
          textColor: 'text-success-green',
          bgColor: 'bg-success-green/10'
        };
      case 'current':
        return {
          icon: <Circle className="h-6 w-6 text-soft-gold" />,
          textColor: 'text-soft-gold',
          bgColor: 'bg-soft-gold/10'
        };
      default:
        return {
          icon: <Circle className="h-6 w-6 text-slate-gray" />,
          textColor: 'text-slate-gray',
          bgColor: 'bg-slate-gray/10'
        };
    }
  };

  return (
    <div className="bg-secondary-bg rounded-xl shadow-card overflow-hidden animate-fadeIn">
      <div className="bg-gradient-to-r from-[#003366] to-[#004D99] px-6 py-4">
        <h3 className="text-lg font-semibold text-white">Document Workflow</h3>
      </div>

      <div className="p-6">
        <div className="relative">
          {/* Connector Line */}
          <div className="absolute top-8 left-8 h-[calc(100%-4rem)] w-px bg-light-border" />

          {/* Steps */}
          <ul className="space-y-8">
            {workflowSteps.map((step, index) => {
              const { icon, textColor, bgColor } = getStatusStyles(step.status);
              
              return (
                <li key={step.id} className="relative">
                  <div className="flex items-center">
                    {/* Status Icon */}
                    <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${bgColor}`}>
                      {icon}
                    </div>

                    {/* Step Content */}
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-lg font-semibold ${textColor}`}>
                            {step.name}
                          </p>
                          <p className="text-sm text-muted-text mt-1">
                            Step {index + 1} of {workflowSteps.length}
                          </p>
                        </div>

                        {step.status === 'current' && (
                          <button className="flex items-center px-4 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-lg font-medium transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
                            Take Action
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPanel;