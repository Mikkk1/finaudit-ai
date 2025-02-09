import React, { useState } from 'react';
import { Save, List, X, Pin, Edit2, Trash2, Check, ChevronRight } from 'lucide-react';

interface SavedView {
  id: string;
  name: string;
  isPinned: boolean;
}

const CustomViews: React.FC = () => {
  const [views, setViews] = useState<SavedView[]>([
    { id: '1', name: 'Default View', isPinned: true },
    { id: '2', name: 'Recent Documents', isPinned: false },
    { id: '3', name: 'Pending Review', isPinned: false }
  ]);
  const [newViewName, setNewViewName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSaveView = () => {
    if (newViewName.trim()) {
      const newView: SavedView = {
        id: Date.now().toString(),
        name: newViewName.trim(),
        isPinned: false
      };
      setViews([...views, newView]);
      setNewViewName('');
    }
  };

  const togglePin = (id: string) => {
    setViews(views.map(view => 
      view.id === id ? { ...view, isPinned: !view.isPinned } : view
    ));
  };

  const startEditing = (view: SavedView) => {
    setEditingId(view.id);
    setEditName(view.name);
  };

  const saveEdit = () => {
    if (editName.trim() && editingId) {
      setViews(views.map(view =>
        view.id === editingId ? { ...view, name: editName.trim() } : view
      ));
      setEditingId(null);
    }
  };

  const deleteView = (id: string) => {
    setViews(views.filter(view => view.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gradient-to-r from-navy-blue to-[#004D99] text-white rounded-md hover:opacity-90 transition-all duration-200 flex items-center space-x-2"
      >
        <List size={18} />
        <span>Custom Views</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-secondary-bg rounded-lg shadow-card z-10 animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-light-border flex justify-between items-center">
            <h3 className="text-lg font-semibold text-dark-text">Saved Views</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-gray hover:text-dark-text transition-colors duration-200 p-1 rounded-full hover:bg-hover-state"
            >
              <X size={18} />
            </button>
          </div>

          {/* Views List */}
          <div className="p-2 max-h-64 overflow-y-auto">
            {views.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((view) => (
              <div 
                key={view.id}
                className="group flex items-center justify-between p-2 hover:bg-hover-state rounded-md transition-colors duration-200"
              >
                <div className="flex items-center space-x-2 flex-grow">
                  <ChevronRight size={16} className="text-slate-gray" />
                  {editingId === view.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-grow p-1 border border-light-border rounded bg-primary-bg focus:outline-none focus:ring-1 focus:ring-navy-blue text-dark-text"
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                      autoFocus
                    />
                  ) : (
                    <span className="text-dark-text">{view.name}</span>
                  )}
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {editingId === view.id ? (
                    <button
                      onClick={saveEdit}
                      className="p-1 text-success-green hover:bg-hover-state rounded transition-colors duration-200"
                    >
                      <Check size={16} />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => togglePin(view.id)}
                        className={`p-1 hover:bg-hover-state rounded transition-colors duration-200 ${
                          view.isPinned ? 'text-soft-gold' : 'text-slate-gray'
                        }`}
                      >
                        <Pin size={16} />
                      </button>
                      <button
                        onClick={() => startEditing(view)}
                        className="p-1 text-slate-gray hover:bg-hover-state rounded transition-colors duration-200"
                      >
                        <Edit2 size={16} />
                      </button>
                      {!view.isPinned && (
                        <button
                          onClick={() => deleteView(view.id)}
                          className="p-1 text-slate-gray hover:text-error-red hover:bg-hover-state rounded transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* New View Input */}
          <div className="p-4 border-t border-light-border bg-primary-bg rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="New view name"
                className="flex-grow p-2 border border-light-border rounded-md bg-secondary-bg focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all duration-200 text-dark-text placeholder-muted-text"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveView()}
              />
              <button
                onClick={handleSaveView}
                disabled={!newViewName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-navy-blue to-[#004D99] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                <Save size={18} />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomViews;