export const getAvatarUrl = (avatar, name) =>
  avatar ||
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'user')}&backgroundColor=1d4ed8&textColor=ffffff`;

