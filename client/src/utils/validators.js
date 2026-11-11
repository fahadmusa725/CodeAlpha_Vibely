export const EMAIL_REGEX =
  /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;

export const isValidEmail = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
};

export const validateField = (name, value) => {
  const val = typeof value === 'string' ? value : '';
  const trimmed = val.trim();

  switch (name) {
    case 'fullName':
      if (!trimmed) {
        return 'Full name is required';
      }
      if (trimmed.length > 50) {
        return 'Full name cannot exceed 50 characters';
      }
      return '';

    case 'username':
      if (!trimmed) {
        return 'Username is required';
      }
      if (trimmed.length < 3 || trimmed.length > 30) {
        return 'Username must be between 3 and 30 characters';
      }
      if (!USERNAME_REGEX.test(trimmed)) {
        return 'Username can only contain letters, numbers, underscores and dots';
      }
      return '';

    case 'email':
      if (!trimmed) {
        return 'Email is required';
      }
      if (!isValidEmail(trimmed)) {
        return 'Enter a valid email address';
      }
      return '';

    case 'password':
      if (!val) {
        return 'Password is required';
      }
      if (val.length < 6) {
        return 'Password must be at least 6 characters';
      }
      return '';

    default:
      return '';
  }
};

