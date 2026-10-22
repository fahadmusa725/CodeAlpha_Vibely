import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TrendLine from './TrendLine';
import './StatCard.css';

const StatCard = ({ icon, label, value, tone, trend, footnote }) => (
  <div className={`admin-stat-card ${tone}`}>
    <span className="admin-stat-icon">
      <FontAwesomeIcon icon={icon} style={{ fontSize: 18 }} />
    </span>
    <span className="admin-stat-label">{label}</span>
    {value === null ? (
      <div className="skeleton admin-stat-skeleton" />
    ) : (
      <span className="admin-stat-value">{value.toLocaleString()}</span>
    )}
    {value !== null && <TrendLine trend={trend} footnote={footnote} />}
  </div>
);

export default StatCard;
