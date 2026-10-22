import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark, faChevronLeft, faChevronRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import { getAvatarUrl } from '../../utils/avatar';
import VerifiedBadge from '../../components/VerifiedBadge';
import EmptyState from './EmptyState';
import { PAGE_SIZE, formatDate } from './adminUtils';
import './UsersSection.css';

const UsersSection = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, hasMore: false });
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      setError('');
      api
        .get('/admin/users', { params: { q: search.trim(), page, limit: PAGE_SIZE } })
        .then((res) => {
          if (ignore) return;
          setUsers(res.data.data);
          setPagination(res.data.pagination);
        })
        .catch(() => {
          if (!ignore) setError('Could not load users.');
        });
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [search, page, reloadKey]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
    setUsers(null);
  };

  const toggleVerify = async (user) => {
    setActionError('');
    try {
      const res = await api.patch(`/admin/users/${user._id}/verify`);
      setUsers((prev) =>
        prev.map((item) => (item._id === user._id ? { ...item, isVerified: res.data.data.isVerified } : item))
      );
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not update verification.');
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete @${user.username}? Their posts, comments, stories and follows will be removed. This cannot be undone.`)) return;

    setActionError('');
    try {
      await api.delete(`/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not delete this account.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / PAGE_SIZE));

  return (
    <div className="admin-card admin-users-card">
      <div className="admin-users-toolbar">
        <div className="admin-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 15 }} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search by username or email"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="admin-search-input"
          />
          {search && (
            <button className="admin-search-clear" onClick={() => handleSearch('')} aria-label="Clear search">
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 13 }} />
            </button>
          )}
        </div>
        <span className="admin-users-total">{pagination.total.toLocaleString()} accounts</span>
      </div>

      {actionError && <div className="admin-action-error">{actionError}</div>}

      {error ? (
        <div className="admin-empty admin-empty-error">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Joined</th>
                <th className="admin-col-num">Posts</th>
                <th className="admin-col-num">Followers</th>
                <th>Status</th>
                <th className="admin-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!users &&
                [0, 1, 2, 3, 4].map((row) => (
                  <tr key={row} className="admin-row-skeleton">
                    <td colSpan={6}>
                      <div className="admin-row-loading">
                        <span className="skeleton admin-skel-avatar" />
                        <span className="skeleton admin-skel-line" />
                        <span className="skeleton admin-skel-line short" />
                      </div>
                    </td>
                  </tr>
                ))}

              {users && users.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={faMagnifyingGlass}
                      title={search ? 'No users match this search' : 'No users yet'}
                      text={search ? 'Try a different username or email.' : undefined}
                    />
                  </td>
                </tr>
              )}

              {users &&
                users.map((user) => {
                  const isAdmin = user.role === 'admin';
                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="admin-user-cell">
                          <img
                            src={getAvatarUrl(user.avatar, user.username)}
                            alt={user.username}
                            className={`admin-user-avatar ${user.isVerified ? 'is-verified' : ''}`}
                          />
                          <div className="admin-user-info">
                            <span className="admin-user-name">@{user.username}</span>
                            <span className="admin-user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="admin-cell-joined">{formatDate(user.createdAt)}</td>
                      <td className="admin-col-num">{user.postsCount.toLocaleString()}</td>
                      <td className="admin-col-num">{user.followersCount.toLocaleString()}</td>
                      <td>
                        <div className="admin-badges">
                          {isAdmin && <span className="admin-badge admin">Admin</span>}
                          {user.isVerified ? (
                            <span className="admin-badge verified">
                              <VerifiedBadge size={12} /> Verified
                            </span>
                          ) : (
                            !isAdmin && <span className="admin-badge">Member</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button className="btn btn-secondary admin-verify-btn" onClick={() => toggleVerify(user)}>
                            {user.isVerified ? 'Remove badge' : 'Verify'}
                          </button>
                          <button
                            className="admin-delete-btn"
                            onClick={() => deleteUser(user)}
                            disabled={isAdmin}
                            title={isAdmin ? 'The admin account cannot be deleted' : 'Delete account'}
                            aria-label={`Delete @${user.username}`}
                          >
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 14 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-pagination">
        <button
          className="btn btn-secondary"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1 || !users}
        >
          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 12 }} /> Previous
        </button>
        <span className="admin-page-label">Page {page} of {totalPages}</span>
        <button
          className="btn btn-secondary"
          onClick={() => setPage((current) => current + 1)}
          disabled={!pagination.hasMore || !users}
        >
          Next <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 12 }} />
        </button>
      </div>
    </div>
  );
};

export default UsersSection;
