import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout.tsx';
import Login from './pages/Auth/Login.tsx';
import SignUp from './pages/Auth/Register.tsx';
import MainDashboard from './pages/Dashboard/MainDashboard.tsx';
import DocumentUpload from './pages/Documents/DocumentUpload.tsx';
import DocumentList from './pages/Documents/DocumentList.tsx';
import DocumentView from './pages/Documents/DocumentView.tsx';
import DocumentAnalysis from './pages/Documents/DocumentAnalysis.tsx';
import DocumentAutomation from './pages/Documents/DocumentAutomation.tsx';
import UserSettings from './pages/Settings/UserSettings.tsx';
import SystemSettings from './pages/Settings/SystemSettings.tsx';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<DocumentList />} />
          <Route path="/documents/upload" element={<DocumentUpload />} />
          <Route path="/documents" element={<DocumentList />} />
          <Route path="/documents/:id" element={<DocumentView />} />
          <Route path="/documents/analysis" element={<DocumentAnalysis />} />
          <Route path="/documents/automation" element={<DocumentAutomation />} />
          <Route path="/settings/user" element={<UserSettings />} />
          <Route path="/settings/system" element={<SystemSettings />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;

