import React from 'react';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';
import './TrendingCard.css';

const TrendingCard = ({ tags }) => (
  <div className="admin-card">
    <div className="admin-card-header">
      <div>
        <h3>Trending Hashtags</h3>
        <p>Last 30 days</p>
      </div>
    </div>

    {!tags ? (
      <ListSkeleton />
    ) : tags.length === 0 ? (
      <EmptyState icon={faHashtag} title="No hashtags yet" text="Tags from the last 30 days will appear here." />
    ) : (
      <ol className="admin-rank-list">
        {tags.map((item, index) => (
          <li key={item.tag} className="admin-rank-item">
            <span className="admin-rank-number">{index + 1}</span>
            <span className="admin-rank-name">#{item.tag}</span>
            <span className="admin-rank-count">{item.count.toLocaleString()} posts</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

export default TrendingCard;
