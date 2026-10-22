import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';
import { timeAgo } from './adminUtils';
import './RecentSignupsCard.css';

const RecentSignupsCard = ({ refreshKey, onViewAll }) => {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    api
      .get('/admin/users', { params: { page: 1, limit: 5 } })
      .then((res) => {
        if (!ignore) {
          setError('');
          setUsers(res.data.data);
        }
      })
      .catch(() => {
        if (!ignore) setError('Could not load recent signups.');
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h3>Recent Signups</h3>
        </div>
        <button className="admin-view-all" onClick={onViewAll}>View all</button>
      </div>

      {error ? (
        <EmptyState icon={faUsers} title={error} />
      ) : !users ? (
        <ListSkeleton />
      ) : users.length === 0 ? (
        <EmptyState icon={faUsers} title="No signups yet" />
      ) : (
        <ul className="admin-activity-list">
          {users.map((user) => (
            <li key={user._id} className="admin-activity-item">
              <span className="admin-activity-icon">
                <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: 14 }} />
              </span>
              <div className="admin-activity-info">
                <span className="admin-activity-title">New user registered</span>
                <span className="admin-activity-sub">@{user.username}</span>
              </div>
              <span className="admin-activity-time">{timeAgo(user.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentSignupsCard;
