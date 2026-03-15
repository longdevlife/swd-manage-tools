// utils/roleHelpers.js
// Role check utilities
import { ROLES } from '@/config/constants';

/**
 * Check if user has specific role
 * @param {object} user - User object from Redux store
 * @param {string} role - Role name from ROLES constant
 * @returns {boolean}
 */
export function hasRole(user, role) {
  if (!user?.roles) return false;
  return user.roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 * @param {object} user
 * @param {string[]} roles
 * @returns {boolean}
 */
export function hasAnyRole(user, roles) {
  if (!user?.roles) return false;
  return roles.some((role) => user.roles.includes(role));
}

/**
 * Check if user is admin
 */
export const isAdmin = (user) => hasRole(user, ROLES.ADMIN);

/**
 * Check if user is lecturer
 */
export const isLecturer = (user) => hasRole(user, ROLES.LECTURER);

/**
 * Check if user is leader
 */
export const isLeader = (user) => hasRole(user, ROLES.LEADER);

/**
 * Check if user can configure integrations (Leader or Admin)
 */
export const canConfigure = (user) => hasAnyRole(user, [ROLES.ADMIN, ROLES.LEADER]);

/**
 * Check if user can trigger sync (Leader, Lecturer, Admin)
 */
export const canSync = (user) => hasAnyRole(user, [ROLES.ADMIN, ROLES.LECTURER, ROLES.LEADER]);

/**
 * Check if user can manage members (Admin, Lecturer)
 */
export const canManageMembers = (user) => hasAnyRole(user, [ROLES.ADMIN, ROLES.LECTURER]);
