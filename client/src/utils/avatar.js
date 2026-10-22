export const getAvatarUrl = (avatar, name) =>
  avatar ||
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'user')}&backgroundColor=0ea5e9&textColor=ffffff`;

