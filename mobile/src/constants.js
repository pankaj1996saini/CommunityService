// Keep these in sync with server/src/constants.js

export const CATEGORIES = ['Water', 'Electrical', 'Infrastructure', 'Sanitation', 'Security', 'Maintenance', 'Other'];
export const STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// Ionicons names
export const CATEGORY_ICONS = {
  Water: 'water-outline',
  Electrical: 'flash-outline',
  Infrastructure: 'construct-outline',
  Sanitation: 'trash-outline',
  Security: 'shield-checkmark-outline',
  Maintenance: 'build-outline',
  Other: 'ellipsis-horizontal-circle-outline',
};

export const DEMO_LOGINS = [
  { label: 'Admin', email: 'admin@community.test', password: 'Admin@123' },
  { label: 'Staff', email: 'ravi@community.test', password: 'Staff@123' },
  { label: 'User', email: 'asha@community.test', password: 'User@123' },
];
