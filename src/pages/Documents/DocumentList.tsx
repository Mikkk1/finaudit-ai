import React, { useState, useEffect } from 'react';
import { Grid, List, Filter, Search, Plus, FileText } from 'lucide-react';
import DocumentGrid from '../../components/DocumentList/DocumentGrid.tsx';
import DocumentListView from '../../components/DocumentList/DocumentListView.tsx';
import FilterSort from '../../components/DocumentList/FilterSort.tsx';
import BatchOperations from '../../components/DocumentList/BatchOperations.tsx';
import CustomViews from '../../components/DocumentList/CustomViews.tsx';
import Pagination from '../../components/DocumentList/Pagination.tsx';
import DocumentView from './DocumentView.tsx';

import { getDummyDocuments } from '../../types/dummyData.ts';

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'Processed' | 'Analyzing' | 'Error';
  content: string;
}

const DocumentList: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [documents, setDocuments] = useState(getDummyDocuments());
  const [filteredDocuments, setFilteredDocuments] = useState(documents);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filterSortOpen, setFilterSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  useEffect(() => {
    setFilteredDocuments(documents);
  }, [documents]);
  const handleOpenDocument = (id: string) => {
    setSelectedDocumentId(id);
  };

  const handleCloseDocument = () => {
    setSelectedDocumentId(null);
  };
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const searched = documents.filter(doc =>
      doc.name.toLowerCase().includes(query.toLowerCase()) ||
      doc.content.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredDocuments(searched);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const handleFilterSort = (filters: any, sortBy: string) => {
    let filtered = [...documents];
    // Apply filters and sorting logic here
    setFilteredDocuments(filtered);
  };

  const handleBatchOperation = (operation: string) => {
    console.log(`Performing ${operation} on`, selectedDocuments);
  };

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocuments(prev =>
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    );
  };

  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-primary-bg text-dark-text pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <FileText size={32} className="text-navy-blue" />
            <h1 className="text-3xl font-semibold text-dark-text">
              Document List
            </h1>
          </div>
          <button className="flex items-center gap-2 bg-navy-blue hover:bg-navy-blue/90 text-white px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
            <Plus size={20} />
            <span className="font-medium">New Document</span>
          </button>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Search Bar */}
          <div className="mb-6 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray" size={20} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowRecentSearches(true)}
                onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                className="w-full pl-10 pr-4 py-3 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-blue transition-all duration-200"
              />
            </div>
            {showRecentSearches && recentSearches.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-light-border rounded-lg shadow-lg">
                <ul>
                  {recentSearches.map((search, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-hover-state cursor-pointer"
                      onClick={() => handleSearch(search)}
                    >
                      {search}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <div className="flex bg-primary-bg rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    viewMode === 'grid'
                      ? 'bg-soft-gold text-white'
                      : 'text-slate-gray hover:bg-hover-state'
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    viewMode === 'list'
                      ? 'bg-soft-gold text-white'
                      : 'text-slate-gray hover:bg-hover-state'
                  }`}
                >
                  <List size={20} />
                </button>
              </div>

              <button
                onClick={() => setFilterSortOpen(true)}
                className="flex items-center gap-2 bg-primary-bg hover:bg-hover-state px-4 py-2 rounded-lg transition-all duration-300 text-slate-gray hover:text-dark-text"
              >
                <Filter size={18} />
                <span>Filter</span>
              </button>
            </div>

            <CustomViews />
          </div>

          {/* Filter/Sort Panel */}
          {filterSortOpen && (
            <div className="mb-6 p-4 bg-primary-bg rounded-lg border border-light-border">
              <FilterSort onApply={handleFilterSort} onClose={() => setFilterSortOpen(false)} />
            </div>
          )}

          {/* Batch Operations */}
          {selectedDocuments.length > 0 && (
            <div className="mb-6">
              <BatchOperations
                selectedCount={selectedDocuments.length}
                onOperation={handleBatchOperation}
              />
            </div>
          )}

          {/* Document View */}
          <div className="mb-6">
            {viewMode === 'grid' ? (
              <DocumentGrid
                documents={paginatedDocuments}
                selectedDocuments={selectedDocuments}
                onToggleSelection={toggleDocumentSelection}
                onOpenDocument={handleOpenDocument}
              />
            ) : (
              <DocumentListView
                documents={paginatedDocuments}
                selectedDocuments={selectedDocuments}
                onToggleSelection={toggleDocumentSelection}
                onOpenDocument={handleOpenDocument}
              />
            )}
          </div>

          {/* Pagination */}
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredDocuments.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
      </div>
      {selectedDocumentId && (
        <DocumentView
          documentId={selectedDocumentId}
          onClose={handleCloseDocument}
        />
      )}
    </div>
  );
};

export default DocumentList;

