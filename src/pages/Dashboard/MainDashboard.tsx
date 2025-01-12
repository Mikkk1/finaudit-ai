import React from 'react';

const MainDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
          <ul className="list-disc list-inside">
            <li>Document 1</li>
            <li>Document 2</li>
            <li>Document 3</li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Ongoing Audits</h2>
          <ul className="list-disc list-inside">
            <li>Audit 1</li>
            <li>Audit 2</li>
            <li>Audit 3</li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
          <ul className="list-disc list-inside">
            <li>Total Documents: 100</li>
            <li>Completed Audits: 25</li>
            <li>Pending Tasks: 10</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;

