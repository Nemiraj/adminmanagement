import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import GuardDashboard from './pages/GuardDashboard';
import Guards from './pages/Guards';
import AttendanceLogs from './pages/AttendanceLogs';
import Layout from './components/Layout';
import './App.css';

const ProtectedRoute = ({ children, adminOnly = false, guardOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/guard" />;
  if (guardOnly && user.role !== 'guard') return <Navigate to="/admin" />;

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <Layout><AdminDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/guards" element={
        <ProtectedRoute adminOnly>
          <Layout><Guards /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/attendance" element={
        <ProtectedRoute adminOnly>
          <Layout><AttendanceLogs /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/guard" element={
        <ProtectedRoute guardOnly>
          <Layout><GuardDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/guard/attendance" element={
        <ProtectedRoute guardOnly>
          <Layout><AttendanceLogs guardView /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif'
            }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
