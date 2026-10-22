import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import './TrendLine.css';

const TrendLine = ({ trend, footnote }) => {
  if (footnote) return <span className="admin-stat-note">{footnote}</span>;
  if (!trend) return <span className="admin-stat-note">No change vs. last week</span>;
  if (trend.isNew) {
    return (
      <div className="admin-trend-line">
        <span className="admin-trend up">
          <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: 11 }} />
          New
        </span>
        <span className="admin-stat-note">this week</span>
      </div>
    );
  }

  const up = trend.direction === 'up';
  return (
    <div className="admin-trend-line">
      <span className={`admin-trend ${up ? 'up' : 'down'}`}>
        <FontAwesomeIcon icon={up ? faArrowUp : faArrowDown} style={{ fontSize: 11 }} />
        {up ? '+' : '-'}{trend.percent}%
      </span>
      <span className="admin-stat-note">vs. last week</span>
    </div>
  );
};

export default TrendLine;
