import React, { useState, useEffect } from 'react';
import { faUsers, faImage, faComment, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import StatCard from './StatCard';
import UserGrowthChart from './UserGrowthChart';
import AccountsDonut from './AccountsDonut';
import RecentPostsCard from './RecentPostsCard';
import TopUsersCard from './TopUsersCard';
import QuickActions from './QuickActions';
import RecentSignupsCard from './RecentSignupsCard';
import TrendingCard from './TrendingCard';
import { sumCounts, trendOf, buildUsersCsv, downloadFile, EXPORT_PAGE_SIZE, EXPORT_MAX_PAGES } from './adminUtils';
import './Overview.css';

const fetchAllUsers = async () => {
  const rows = [];
  for (let page = 1; page <= EXPORT_MAX_PAGES; page += 1) {
    const res = await api.get('/admin/users', { params: { page, limit: EXPORT_PAGE_SIZE } });
    rows.push(...res.data.data);
    if (!res.data.pagination.hasMore) break;
  }
  return rows;
};

const Overview = ({ onManageUsers }) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    let ignore = false;
    api
      .get('/admin/stats')
      .then((res) => {
        if (!ignore) setStats(res.data.data);
      })
      .catch(() => {
        if (!ignore) setError('Could not load dashboard stats.');
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const refresh = () => {
    setError('');
    setStats(null);
    setReloadKey((key) => key + 1);
  };

  const exportUsers = async () => {
    setExporting(true);
    setExportError('');
    try {
      const rows = await fetchAllUsers();
      if (rows.length === 0) {
        setExportError('There are no users to export.');
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(buildUsersCsv(rows), `vibely-users-${date}.csv`);
    } catch {
      setExportError('Could not export users. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="admin-card admin-error">
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={refresh}>Try again</button>
      </div>
    );
  }

  const usersThisWeek = stats ? sumCounts(stats.newUsersByDay) : 0;
  const postsThisWeek = stats ? sumCounts(stats.newPostsByDay) : 0;

  return (
    <div className="admin-dashboard">
      <div className="admin-dash-main">
        <div className="admin-stat-grid">
          <StatCard
            icon={faUsers}
            label="Total Users"
            value={stats ? stats.totals.users : null}
            tone="tone-violet"
            trend={stats ? trendOf(usersThisWeek, stats.previousWeek.users) : null}
          />
          <StatCard
            icon={faImage}
            label="Total Posts"
            value={stats ? stats.totals.posts : null}
            tone="tone-blue"
            trend={stats ? trendOf(postsThisWeek, stats.previousWeek.posts) : null}
          />
          <StatCard
            icon={faComment}
            label="Total Comments"
            value={stats ? stats.totals.comments : null}
            tone="tone-pink"
            footnote="All time"
          />
          <StatCard
            icon={faLayerGroup}
            label="Active Stories"
            value={stats ? stats.totals.stories : null}
            tone="tone-teal"
            footnote="Live in the last 24 hours"
          />
        </div>

        <div className="admin-row admin-row-chart">
          <UserGrowthChart data={stats ? stats.newUsersByDay : null} />
          <AccountsDonut verified={stats ? stats.totals.verified : null} total={stats ? stats.totals.users : 0} />
        </div>

        <div className="admin-row admin-row-bottom">
          <RecentPostsCard refreshKey={reloadKey} />
          <TopUsersCard users={stats ? stats.topFollowed : null} onViewAll={onManageUsers} />
        </div>
      </div>

      <aside className="admin-dash-side">
        <QuickActions
          onManageUsers={onManageUsers}
          onExport={exportUsers}
          exporting={exporting}
          exportError={exportError}
          onRefresh={refresh}
        />
        <RecentSignupsCard refreshKey={reloadKey} onViewAll={onManageUsers} />
        <TrendingCard tags={stats ? stats.trendingTags : null} />
      </aside>
    </div>
  );
};

export default Overview;
