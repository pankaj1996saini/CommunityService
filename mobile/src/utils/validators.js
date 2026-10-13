// Each validator returns an object like { fieldName: 'message' }. Empty object = all good.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const digitsOnly = (v = '') => v.replace(/\D/g, '');

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Enter your email';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'That email does not look right';
  if (!password) errors.password = 'Enter your password';
  return errors;
}

export function validateRegister({ name, email, phone, password, confirm }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Please enter your name';
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (phone && digitsOnly(phone).length !== 10) errors.phone = 'Phone number should have 10 digits';
  if (password.length < 6) errors.password = 'Use at least 6 characters';
  if (confirm !== password) errors.confirm = 'Passwords do not match';
  return errors;
}

export function validateComplaint({ title, category, location, description }) {
  const errors = {};
  if (title.trim().length < 3) errors.title = 'Give the problem a short title (3+ characters)';
  else if (title.trim().length > 100) errors.title = 'Keep the title under 100 characters';
  if (!category) errors.category = 'Pick a category';
  if (location.trim().length < 2) errors.location = 'Where is the problem?';
  if (description.trim().length < 10) errors.description = 'Add a bit more detail (10+ characters)';
  else if (description.trim().length > 1000) errors.description = 'Keep it under 1000 characters';
  return errors;
}

export function validateProfile({ name, phone, newPassword, currentPassword }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Please enter your name';
  if (phone && digitsOnly(phone).length !== 10) errors.phone = 'Phone number should have 10 digits';
  if (newPassword) {
    if (!currentPassword) errors.currentPassword = 'Enter your current password to change it';
    if (newPassword.length < 6) errors.newPassword = 'Use at least 6 characters';
  }
  return errors;
}

export function validateStaffForm({ name, email, phone, password }, isNew) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Please enter a name';
  if (isNew && !EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (phone && digitsOnly(phone).length !== 10) errors.phone = 'Phone number should have 10 digits';
  if (isNew && password.length < 6) errors.password = 'Use at least 6 characters';
  if (!isNew && password && password.length < 6) errors.password = 'Use at least 6 characters';
  return errors;
}
