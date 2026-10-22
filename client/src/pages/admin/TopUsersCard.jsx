import React from 'react';
import { faFire } from '@fortawesome/free-solid-svg-icons';
import { getAvatarUrl } from '../../utils/avatar';
import VerifiedBadge from '../../components/VerifiedBadge';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';
import './TopUsersCard.css';

const TopUsersCard = ({ users, onViewAll }) => (
  <div className="admin-card">
    <div className="admin-card-header">
      <div>
        <h3>Top Users</h3>
        <p>Most followed creators</p>
      </div>
      <button className="admin-view-all" onClick={onViewAll}>View all</button>
    </div>

    {!users ? (
      <ListSkeleton />
    ) : users.length === 0 ? (
      <EmptyState icon={faFire} title="No followers yet" text="Creators with the most followers will be listed here." />
    ) : (
      <ol className="admin-top-list">
        {users.map((user, index) => (
          <li key={user._id} className="admin-top-item">
            <span className="admin-top-rank">{index + 1}</span>
            <img
              src={getAvatarUrl(user.avatar, user.fullName)}
              alt={user.username}
              className={`admin-top-avatar ${user.isVerified ? 'is-verified' : ''}`}
            />
            <div className="admin-top-info">
              <span className="admin-top-name">
                {user.fullName}
                {user.isVerified && <VerifiedBadge size={12} />}
              </span>
              <span className="admin-top-handle">@{user.username}</span>
            </div>
            <span className="admin-top-count">{user.followersCount.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

export default TopUsersCard;
