import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './EmptyState.css';

const EmptyState = ({ icon, title, text }) => (
  <div className="admin-empty">
    <span className="admin-empty-icon">
      <FontAwesomeIcon icon={icon} style={{ fontSize: 16 }} />
    </span>
    <p className="admin-empty-title">{title}</p>
    {text && <p className="admin-empty-text">{text}</p>}
  </div>
);

export default EmptyState;
