import React, { useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClose: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClose }) => {
  const [query, setQuery] = useState('');
  const [recentSearches] = useState([
    'Financial Report 2024',
    'Budget Analysis',
    'Project Proposal'
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-text/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-secondary-bg rounded-lg shadow-card w-full max-w-md m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-blue to-[#004D99] p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-secondary-bg">Search Documents</h2>
            <button 
              onClick={onClose}
              className="text-secondary-bg/80 hover:text-secondary-bg transition-colors duration-200 p-1 rounded-full hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search Form */}
        <div className="p-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <Search 
                size={20} 
                className="absolute left-3 text-slate-gray"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-3 border border-light-border rounded-md bg-primary-bg focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-200 text-dark-text placeholder-muted-text"
              />
            </div>

            {/* Recent Searches */}
            {query === '' && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-gray mb-2">Recent Searches</h3>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="w-full flex items-center justify-between p-2 text-left text-dark-text hover:bg-hover-state rounded-md transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <Search size={16} className="text-slate-gray mr-2" />
                        <span>{search}</span>
                      </div>
                      <ArrowRight size={16} className="text-slate-gray" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-primary-bg rounded-b-lg border-t border-light-border">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-gray hover:text-dark-text bg-secondary-bg border border-light-border rounded-md hover:bg-hover-state transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-gradient-to-r from-navy-blue to-[#004D99] text-white rounded-md hover:opacity-90 transition-opacity duration-200 font-medium flex items-center"
            >
              <Search size={18} className="mr-2" />
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;