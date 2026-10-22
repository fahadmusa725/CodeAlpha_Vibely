import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from './EmptyState';
import { COLORS, tooltipStyle, shortDay } from './adminUtils';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import './UserGrowthChart.css';

const UserGrowthChart = ({ data }) => {
  const total = data ? data.reduce((sum, row) => sum + row.count, 0) : 0;

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h3>User Growth</h3>
          <p>New users over the last 7 days</p>
        </div>
        <span className="admin-period-chip">Last 7 days</span>
      </div>

      {!data ? (
        <div className="skeleton admin-chart-skeleton" />
      ) : total === 0 ? (
        <EmptyState icon={faChartLine} title="No new users this week" text="Sign-ups will show up here as they happen." />
      ) : (
        <div className="admin-chart">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="adminUsersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.users} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={COLORS.users} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDay} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} dy={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={shortDay} />
              <Area
                type="linear"
                dataKey="count"
                name="New users"
                stroke={COLORS.users}
                strokeWidth={2.5}
                fill="url(#adminUsersGradient)"
                dot={{ r: 4, fill: COLORS.users, stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.users }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default UserGrowthChart;
