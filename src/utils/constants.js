// User roles
export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  STAFF: 'staff'
};

// Status colors
export const STATUS_COLORS = {
  IN_STOCK: 'bg-green-100 text-green-800',
  LOW_STOCK: 'bg-yellow-100 text-yellow-800',
  OUT_OF_STOCK: 'bg-red-100 text-red-800'
};

// Password validation rules
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MM/DD/YYYY',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss'
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Please enter a valid email address',
  WEAK_PASSWORD: 'Password does not meet requirements',
  PASSWORD_MISMATCH: 'Passwords do not match',
  REQUIRED_FIELD: 'This field is required',
  LOGIN_FAILED: 'Invalid email or password',
  NETWORK_ERROR: 'Network error. Please check your connection'
};

// Success messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  PRODUCT_ADDED: 'Product added successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  SALE_COMPLETED: 'Sale completed successfully'
};

// Database paths
export const DB_PATHS = {
  USERS: 'users',
  INVENTORY: 'inventory',
  SALES: 'sales',
  SYSTEM_CONFIG: 'systemConfig'
};

export default {
  USER_ROLES,
  STATUS_COLORS,
  PASSWORD_RULES,
  DATE_FORMATS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DB_PATHS
};