import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faDownload, faArrowRotateRight, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import './QuickActions.css';

const QuickActions = ({ onManageUsers, onExport, exporting, exportError, onRefresh }) => (
  <div className="admin-card">
    <div className="admin-card-header">
      <div>
        <h3>Quick Actions</h3>
      </div>
    </div>
    <div className="admin-quick-list">
      <button className="admin-quick-action shade-1" onClick={onManageUsers}>
        <span className="admin-quick-icon">
          <FontAwesomeIcon icon={faUsers} style={{ fontSize: 14 }} />
        </span>
        <span className="admin-quick-text">Manage Users</span>
        <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 13 }} />
      </button>
      <button className="admin-quick-action shade-2" onClick={onExport} disabled={exporting}>
        <span className="admin-quick-icon">
          <FontAwesomeIcon icon={faDownload} style={{ fontSize: 14 }} />
        </span>
        <span className="admin-quick-text">{exporting ? 'Exporting...' : 'Export Users CSV'}</span>
        <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 13 }} />
      </button>
      <button className="admin-quick-action shade-3" onClick={onRefresh}>
        <span className="admin-quick-icon">
          <FontAwesomeIcon icon={faArrowRotateRight} style={{ fontSize: 14 }} />
        </span>
        <span className="admin-quick-text">Refresh Dashboard</span>
        <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 13 }} />
      </button>
    </div>
    {exportError && <p className="admin-export-error">{exportError}</p>}
  </div>
);

export default QuickActions;
