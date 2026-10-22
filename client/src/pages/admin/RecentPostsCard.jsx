import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faHeart, faComment } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import { getAvatarUrl } from '../../utils/avatar';
import EmptyState from './EmptyState';
import ListSkeleton from './ListSkeleton';
import { formatDate } from './adminUtils';
import './RecentPostsCard.css';

const RecentPostsCard = ({ refreshKey }) => {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    api
      .get('/admin/posts/recent')
      .then((res) => {
        if (!ignore) {
          setError('');
          setPosts(res.data.data);
        }
      })
      .catch(() => {
        if (!ignore) setError('Could not load recent posts.');
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  return (
    <div className="admin-card admin-card-wide">
      <div className="admin-card-header">
        <div>
          <h3>Recent Posts</h3>
          <p>Latest posts across the platform</p>
        </div>
      </div>

      {error ? (
        <EmptyState icon={faImage} title={error} />
      ) : !posts ? (
        <ListSkeleton />
      ) : posts.length === 0 ? (
        <EmptyState icon={faImage} title="No posts yet" text="Posts from creators will be listed here." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-posts-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Author</th>
                <th>Engagement</th>
                <th className="admin-col-date">Date</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id}>
                  <td>
                    <div className="admin-post-cell">
                      {post.image ? (
                        <img src={post.image} alt="" className="admin-post-thumb" />
                      ) : (
                        <span className="admin-post-thumb admin-post-thumb-empty">
                          <FontAwesomeIcon icon={faImage} style={{ fontSize: 14 }} />
                        </span>
                      )}
                      <span className="admin-post-caption">{post.caption || 'Untitled post'}</span>
                    </div>
                  </td>
                  <td>
                    {post.author ? (
                      <div className="admin-author-cell">
                        <img src={getAvatarUrl(post.author.avatar, post.author.fullName)} alt="" className="admin-author-avatar" />
                        <span>{post.author.fullName}</span>
                      </div>
                    ) : (
                      <span className="admin-author-missing">Deleted account</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-engagement">
                      <span className="admin-engagement-item likes">
                        <FontAwesomeIcon icon={faHeart} style={{ fontSize: 12 }} />
                        {post.likesCount.toLocaleString()}
                      </span>
                      <span className="admin-engagement-item comments">
                        <FontAwesomeIcon icon={faComment} style={{ fontSize: 12 }} />
                        {post.commentsCount.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="admin-col-date">{formatDate(post.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentPostsCard;
