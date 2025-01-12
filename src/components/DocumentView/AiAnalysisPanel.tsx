import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LightbulbIcon, TrendingUp, DollarSign, LineChart } from 'lucide-react';

interface FinancialMetric {
  [key: string]: string | number;
}

interface AIAnalysis {
  keyInsights: string[];
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  financialMetrics: FinancialMetric;
}

interface AIAnalysisPanelProps {
  document: {
    aiAnalysis: AIAnalysis;
  };
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ document }) => {
  const sentimentData = [
    { 
      name: 'Positive', 
      value: document.aiAnalysis.sentiment.positive,
      fill: '#059669'  // success-green
    },
    { 
      name: 'Neutral', 
      value: document.aiAnalysis.sentiment.neutral,
      fill: '#64748B'  // slate-gray
    },
    { 
      name: 'Negative', 
      value: document.aiAnalysis.sentiment.negative,
      fill: '#DC2626'  // error-red
    },
  ];

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="px-6 py-4 bg-gradient-to-r from-navy-blue to-[#004D99] rounded-t-xl">
      <div className="flex items-center space-x-2">
        <Icon className="h-5 w-5 text-white" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-secondary-bg p-3 rounded-lg shadow-lg border border-light-border">
          <p className="text-dark-text font-medium">{label}</p>
          <p className="text-slate-gray">
            Value: {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Key Insights Section */}
      <div className="bg-secondary-bg rounded-xl shadow-card border border-light-border">
        <SectionHeader icon={LightbulbIcon} title="Key Insights" />
        <div className="divide-y divide-light-border">
          {document.aiAnalysis.keyInsights.map((insight, index) => (
            <div key={index} className="p-6 hover:bg-primary-bg transition-colors duration-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-soft-gold bg-opacity-10 rounded-lg flex items-center justify-center">
                  <span className="text-soft-gold font-semibold">{index + 1}</span>
                </div>
                <p className="text-dark-text">{insight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment Analysis Section */}
      <div className="bg-secondary-bg rounded-xl shadow-card border border-light-border">
        <SectionHeader icon={TrendingUp} title="Sentiment Analysis" />
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sentimentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis 
                tick={{ fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
                unit="%" 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Metrics Section */}
      <div className="bg-secondary-bg rounded-xl shadow-card border border-light-border">
        <SectionHeader icon={DollarSign} title="Financial Metrics" />
        <div className="divide-y divide-light-border">
          {Object.entries(document.aiAnalysis.financialMetrics).map(([key, value]) => (
            <div key={key} className="p-6 hover:bg-primary-bg transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <LineChart className="h-5 w-5 text-navy-blue" />
                  <dt className="text-slate-gray font-medium">
                    {key.split(/(?=[A-Z])/).join(' ')}
                  </dt>
                </div>
                <dd className="text-dark-text font-semibold">
                  {typeof value === 'number' ? 
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(value) : 
                    value
                  }
                </dd>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;