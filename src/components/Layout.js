import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const AdminNav = [
  { path: '/admin', label: 'Dashboard', icon: '▣' },
  { path: '/admin/guards', label: 'Guards', icon: '👮' },
  { path: '/admin/attendance', label: 'Logs', icon: '≡' }
];

const GuardNav = [
  { path: '/guard', label: 'Dashboard', icon: '⌂' },
  { path: '/guard/attendance', label: 'My Logs', icon: '≡' }
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = isAdmin ? AdminNav : GuardNav;

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    toast.success('Successfully logged out.');
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 95
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="brand-icon">🛡️</span>
          <span className="brand-name">Raksham</span>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/guard'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <header className="top-header">
          <button className="mobile-toggle" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>

          <div className="header-right">
            <div className="user-profile" onClick={() => setMenuOpen(!menuOpen)}>
              <div className="user-avatar">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{isAdmin ? 'Admin' : 'Guard'}</span>
              </div>
            </div>

            {menuOpen && (
              <div className="dropdown">
                <div className="dropdown-info" style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <span>⏻</span> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
