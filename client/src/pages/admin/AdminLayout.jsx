import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles,
  faHouse,
  faUsers,
  faMagnifyingGlass,
  faSun,
  faMoon,
  faRightFromBracket,
  faCalendarDays,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarUrl } from '../../utils/avatar';
import Overview from './Overview';
import UsersSection from './UsersSection';
import './AdminLayout.css';

const SECTIONS = [
  { id: 'overview', label: 'Dashboard', icon: faHouse, subtitle: "Here's what's happening with your platform today." },
  { id: 'users', label: 'Users', icon: faUsers, subtitle: 'Search, verify and manage accounts.' },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('overview');
  const current = SECTIONS.find((section) => section.id === activeSection);
  const today = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const firstName = (user?.fullName || 'Admin').split(' ')[0];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-badge">
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 18 }} />
          </span>
          <span className="admin-brand-name">Vibely</span>
        </div>

        <nav className="admin-nav">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`admin-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <FontAwesomeIcon icon={section.icon} style={{ fontSize: 17 }} />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-quick-links">
          <span className="admin-quick-links-title">Quick Links</span>
          <button className="admin-link-item" onClick={() => setActiveSection('users')}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 14 }} />
            <span>Find an account</span>
          </button>
          <button className="admin-link-item" onClick={toggleTheme}>
            <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} style={{ fontSize: 14 }} />
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>

        <div className="admin-sidebar-profile">
          <img src={getAvatarUrl(user?.avatar, user?.fullName)} alt="" className="admin-profile-avatar" />
          <div className="admin-profile-info">
            <span className="admin-profile-name">{user?.fullName || 'Admin'}</span>
            <span className="admin-profile-role">Administrator</span>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout} title="Log out" aria-label="Log out">
            <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: 15 }} />
          </button>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <span className="admin-topbar-title">{current.label}</span>
          <div className="admin-topbar-actions">
            <button className="admin-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} style={{ fontSize: 16 }} />
            </button>
            <div className="admin-topbar-user">
              <img src={getAvatarUrl(user?.avatar, user?.fullName)} alt="" className="admin-topbar-avatar" />
              <div className="admin-topbar-user-info">
                <span className="admin-topbar-name">{user?.fullName || 'Admin'}</span>
                <span className="admin-topbar-role">Admin</span>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-main">
          <div className="admin-welcome">
            <div>
              <h1>{activeSection === 'overview' ? `Welcome back, ${firstName}` : current.label}</h1>
              <p>{current.subtitle}</p>
            </div>
            <span className="admin-header-date">
              {today}
              <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize: 16 }} />
            </span>
          </div>

          {activeSection === 'overview' ? (
            <Overview onManageUsers={() => setActiveSection('users')} />
          ) : (
            <UsersSection />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
