import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart, 
  Upload, 
  List, 
  Beaker, 
  Zap, 
  Settings
} from 'lucide-react';

interface SidebarProps {
  isExpanded?: boolean; // Made optional since we'll control it internally
}

const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: BarChart },
    { name: 'Upload Document', path: '/documents/upload', icon: Upload },
    { name: 'Document List', path: '/documents', icon: List },
    { name: 'Document Analysis', path: '/documents/analysis', icon: Beaker },
    { name: 'Document Automation', path: '/documents/automation', icon: Zap },
    { name: 'Settings', path: '/settings/user', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside
      className={`bg-white border-r border-light-border shadow-card transition-all duration-300 ease-in-out
        fixed left-0 top-16 h-[calc(100vh-4rem)] z-50
        ${isHovered ? 'w-64' : 'w-16'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Menu */}
      <div className="p-3 pt-8">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActiveRoute = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center rounded-lg group relative overflow-hidden
                  transition-all duration-300 ease-in-out
                  ${isActiveRoute 
                    ? 'bg-primary-bg text-navy-blue font-medium' 
                    : 'text-slate-gray hover:bg-hover-state hover:text-navy-blue'
                  }
                  ${isHovered ? 'px-4 py-3' : 'px-3 py-3 justify-center'}`}
              >
                <div className={`flex items-center ${isHovered ? 'gap-3' : ''}`}>
                  <item.icon 
                    className={`w-5 h-5 transition-transform duration-300
                      ${isActiveRoute ? 'text-navy-blue' : 'group-hover:text-navy-blue'}
                      ${!isHovered && 'group-hover:scale-110'}`} 
                  />
                  <span
                    className={`whitespace-nowrap transition-all duration-300
                      ${isHovered ? 'opacity-100 ml-3' : 'opacity-0 w-0 hidden'}
                      ${isActiveRoute ? 'text-navy-blue' : ''}`}
                  >
                    {item.name}
                  </span>
                </div>
                
                {/* Active Indicator */}
                {isActiveRoute && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-soft-gold rounded-r" />
                )}

                {/* Tooltip for collapsed state */}
                {!isHovered && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-navy-blue text-white text-sm
                    rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Only visible when expanded */}
      {isHovered && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-light-border">
          <div className="flex items-center gap-3 text-slate-gray">
            <div className="w-8 h-8 rounded-full bg-primary-bg flex items-center justify-center">
              <Settings size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Quick Settings</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;