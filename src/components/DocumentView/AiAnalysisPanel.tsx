import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LightbulbIcon, TrendingUpIcon, DollarSignIcon, LineChartIcon, ListIcon, KeyIcon, HashIcon, FileTextIcon } from 'lucide-react';

interface AIAnalysis {
  [key: string]: any; // Generic structure to handle any type of analysis
}

interface AIAnalysisPanelProps {
  document: {
    aiAnalysis?: AIAnalysis[];
  };
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ document }) => {
  // Check if aiAnalysis is empty or undefined
  if (!document.aiAnalysis || document.aiAnalysis.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 animate-fadeIn">
        <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
          <div className="flex items-center space-x-2">
            <LightbulbIcon className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
          </div>
        </div>
        <div className="p-6 text-center text-gray-500">
          No AI analysis available for this document.
        </div>
      </div>
    );
  }

  // Helper function to determine the appropriate icon for different section types
  const getSectionIcon = (key: string) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('summary')) return FileTextIcon;
    if (keyLower.includes('key') || keyLower.includes('attributes')) return KeyIcon;
    if (keyLower.includes('limit')) return HashIcon;
    if (keyLower.includes('potential') || keyLower.includes('application')) return ListIcon;
    if (keyLower.includes('trend') || keyLower.includes('growth')) return TrendingUpIcon;
    if (keyLower.includes('financial') || keyLower.includes('cost')) return DollarSignIcon;
    if (keyLower.includes('chart') || keyLower.includes('data')) return LineChartIcon;
    return LightbulbIcon;
  };

  const SectionHeader = ({ title }: { title: string }) => {
    const Icon = getSectionIcon(title);
    return (
      <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white capitalize">{title}</h3>
        </div>
      </div>
    );
  };

  // Component for string key-value pairs
  const StringValue = ({ value }: { value: string }) => (
    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
      <p className="text-gray-800 whitespace-pre-line">{value}</p>
    </div>
  );

  // Component for list values
  const ListValue = ({ items }: { items: string[] }) => (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {items.map((item, idx) => (
          <li 
            key={idx} 
            className="p-3 flex items-center hover:bg-blue-50 transition-colors duration-200"
          >
            <span className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full mr-3"></span>
            <span className="text-gray-800">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  // Component for nested object values
  const ObjectValue = ({ data }: { data: { [key: string]: any } }) => (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value], idx) => (
        <div key={idx} className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-400">
          <div className="flex items-center mb-2">
            <KeyIcon className="h-4 w-4 text-indigo-600 mr-2" />
            <h4 className="text-gray-900 font-medium capitalize">{key}</h4>
          </div>
          <div className="ml-6 text-gray-800">
            {typeof value === 'string' ? (
              value
            ) : (
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalysisSection = (analysis: AIAnalysis) => {
    return Object.entries(analysis).map(([key, value]) => {
      // For nested objects
      if (typeof value === 'object' && !Array.isArray(value)) {
        return (
          <div key={key} className="bg-white rounded-xl shadow-md border border-gray-200">
            <SectionHeader title={key} />
            <div className="p-6">
              <ObjectValue data={value} />
            </div>
          </div>
        );
      } 
      // For arrays/lists
      else if (Array.isArray(value)) {
        return (
          <div key={key} className="bg-white rounded-xl shadow-md border border-gray-200">
            <SectionHeader title={key} />
            <div className="p-6">
              <ListValue items={value} />
            </div>
          </div>
        );
      } 
      // For simple string values
      else {
        return (
          <div key={key} className="bg-white rounded-xl shadow-md border border-gray-200">
            <SectionHeader title={key} />
            <div className="p-6">
              <StringValue value={value.toString()} />
            </div>
          </div>
        );
      }
    });
  };

  // Custom tooltip component for charts if needed
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-gray-800 font-medium">{label}</p>
          <p className="text-gray-600">
            Value: {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {document.aiAnalysis.map((analysis, index) => (
        <div key={index} className="space-y-6">
          {renderAnalysisSection(analysis)}
        </div>
      ))}
    </div>
  );
};

export default AIAnalysisPanel;