import type React from "react"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import Layout from "./components/Layout/Layout.tsx"
import Login from "./pages/Auth/Login.tsx"
import SignUp from "./pages/Auth/Register.tsx"
import Dashboard from "./pages/Dashboard/MainDashboard.tsx"
import DocumentUpload from "./pages/Documents/DocumentUpload.tsx"
import DocumentList from "./pages/Documents/DocumentList.tsx"
import DocumentView from "./pages/Documents/DocumentView.tsx"
import DocumentAnalysis from "./pages/Documents/DocumentAnalysis.tsx"
import DocumentAutomation from "./pages/Documents/DocumentAutomation.tsx"
import UserSettings from "./pages/Settings/UserSettings.tsx"
import SystemSettings from "./pages/Settings/SystemSettings.tsx"

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const isAuthenticated = !!localStorage.getItem("token")
  return isAuthenticated ? element : <Navigate to="/login" replace />
}

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/"
          element={
            <PrivateRoute
              element={
                <Layout>
                  <DocumentList />
                </Layout>
              }
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />
          }
        />
        <Route
          path="/documents/upload"
          element={
            <PrivateRoute
              element={
                <Layout>
                  <DocumentUpload />
                </Layout>
              }
            />
          }
        />
        <Route
          path="/documents"
          element={
            <PrivateRoute
              element={
                <Layout>
                  <DocumentList />
                </Layout>
              }
            />
          }
        />
        <Route
          path="/documents/:id"
          element={
            <PrivateRoute
              element={
                <Layout>
                  <DocumentView />
                </Layout>
              }
            />
          }
        />
        <Route
          path="/documents/analysis"
          element={
            <PrivateRoute
              element={
                <Layout>
                  <DocumentAnalysis />
                </Layout>
              }
            />
          }
        />
        <Route
          path="/documents/automation"
          element={
            <PrivateRoute
              element={
                <Layout>
                  <DocumentAutomation />
                </Layout>
              }
            />
          }
        />
        <Route
          path="/settings/user"
          element={
            <PrivateRoute
              element={
                <Layout>
                  <UserSettings />
                </Layout>
              }
            />
          }
        />
        <Route
          path="/settings/system"
          element={
            <PrivateRoute
              element={
                <Layout>
                  <SystemSettings />
                </Layout>
              }
            />
          }
        />
      </Routes>
    </Router>
  )
}

export default App

