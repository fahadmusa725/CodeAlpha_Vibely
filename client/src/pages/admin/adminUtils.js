export const PAGE_SIZE = 10;
export const EXPORT_PAGE_SIZE = 50;
export const EXPORT_MAX_PAGES = 20;

export const COLORS = {
  users: 'var(--accent-primary)',
  posts: 'var(--accent-secondary)',
  comments: 'var(--accent-indigo)',
  stories: 'var(--success)',
  verified: 'var(--accent-secondary)',
  regular: 'var(--accent-primary)',
};

export const tooltipStyle = {
  background: 'var(--bg-surface-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: 10,
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
  boxShadow: 'var(--shadow-md)',
};

export const shortDay = (date) => {
  const day = new Date(`${date}T00:00:00Z`);
  return day.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

export const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const timeAgo = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const sumCounts = (rows) => rows.reduce((sum, row) => sum + row.count, 0);

export const trendOf = (current, previous) => {
  if (previous === 0) return current > 0 ? { isNew: true } : null;
  const change = Math.round(((current - previous) / previous) * 100);
  return { percent: Math.abs(change), direction: change >= 0 ? 'up' : 'down' };
};

export const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const buildUsersCsv = (rows) => {
  const header = ['username', 'email', 'role', 'verified', 'joined', 'posts', 'followers'];
  const lines = rows.map((user) =>
    [
      user.username,
      user.email,
      user.role,
      user.isVerified ? 'yes' : 'no',
      new Date(user.createdAt).toISOString().slice(0, 10),
      user.postsCount,
      user.followersCount,
    ]
      .map(escapeCsv)
      .join(',')
  );
  return [header.join(','), ...lines].join('\r\n');
};

export const downloadFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
