import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import EmptyState from './EmptyState';
import { COLORS, tooltipStyle } from './adminUtils';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import './AccountsDonut.css';

const AccountsDonut = ({ verified, total }) => {
  const regular = Math.max(0, total - verified);
  const segments = [
    { name: 'Verified', value: verified, color: COLORS.verified },
    { name: 'Regular', value: regular, color: COLORS.regular },
  ];

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h3>Account Mix</h3>
          <p>Verified against regular accounts</p>
        </div>
      </div>

      {verified === null ? (
        <div className="skeleton admin-chart-skeleton" />
      ) : total === 0 ? (
        <EmptyState icon={faUsers} title="No accounts yet" />
      ) : (
        <div className="admin-donut-body">
          <div className="admin-donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  innerRadius="64%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  paddingAngle={verified > 0 && regular > 0 ? 2 : 0}
                >
                  {segments.map((segment) => (
                    <Cell key={segment.name} fill={segment.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="admin-donut-center">
              <span className="admin-donut-value">{total.toLocaleString()}</span>
              <span className="admin-donut-label">Total users</span>
            </div>
          </div>

          <ul className="admin-donut-legend">
            {segments.map((segment) => (
              <li key={segment.name}>
                <span className="admin-legend-dot" style={{ background: segment.color }} />
                <span className="admin-legend-name">{segment.name}</span>
                <span className="admin-legend-count">{segment.value.toLocaleString()}</span>
                <span className="admin-legend-share">{Math.round((segment.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AccountsDonut;
