// Layout.tsx
import React, { useState } from 'react';
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="fixed inset-0 flex flex-col bg-primary-bg overflow-hidden">
      {/* Header - Fixed height with shadow */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      {/* Main Content Area - Fills remaining space */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - With smooth transition */}
        <div className={`
          fixed left-0 h-full z-40 transition-transform duration-300 ease-in-out
          ${sidebarExpanded ? 'translate-x-0' : '-translate-x-56'}
        `}>
          <Sidebar 
            isExpanded={sidebarExpanded}
            onExpandToggle={setSidebarExpanded}
          />
        </div>

        {/* Main Content - With responsive padding */}
        <main className={`
          flex-1 transition-all duration-300 ease-in-out
          ${sidebarExpanded ? 'ml-10' : 'ml-16'}
        `}>
          {/* Scrollable Content Area */}
          <div className="h-[100vh] p-6">
            <div className="h-full overflow-y-auto rounded-xl">
              {/* Content Wrapper with Max Width */}
              <div className="max-w-7xl mx-auto space-y-6 pb-6">
                {/* Shadow Container */}
                <div className="bg-white rounded-xl shadow-sm border border-light-border">
                  {children}
                </div>
              </div>

              {/* Custom Scrollbar */}
              <style jsx global>{`
                ::-webkit-scrollbar {
                  width: 8px;
                }
                
                ::-webkit-scrollbar-track {
                  background: transparent;
                }
                
                ::-webkit-scrollbar-thumb {
                  background: #E2E8F0;
                  border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                  background: #94A3B8;
                }
              `}</style>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;