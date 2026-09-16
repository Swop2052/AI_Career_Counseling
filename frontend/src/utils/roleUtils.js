/**
 * frontend/src/utils/roleUtils.js
 * Centralized role and permission validation utilities for SkillSense.
 * Ensures consistent casing, trim normalization, and authorization checks.
 */

export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return '';
  return role.trim().toUpperCase();
};

/**
 * Checks if the user has the SUPER_ADMIN role.
 */
export const isSuperAdmin = (user) => {
  if (!user) return false;
  return normalizeRole(user.role) === 'SUPER_ADMIN';
};

/**
 * Checks if the user has the DEVELOPER role.
 */
export const isDeveloper = (user) => {
  if (!user) return false;
  return normalizeRole(user.role) === 'DEVELOPER';
};

/**
 * Checks if the user has permission to access developer or administrative consoles.
 */
export const canAccessDeveloperConsole = (user) => {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'DEVELOPER' || role === 'SUPER_ADMIN';
};

/**
 * Checks if the user has permission to manage users/developers.
 * Super Admins always have permission; Developers have permission only if can_manage_developers is 1/true.
 */
export const canManageUsers = (user) => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (isDeveloper(user) && Boolean(user.can_manage_developers)) return true;
  return false;
};
