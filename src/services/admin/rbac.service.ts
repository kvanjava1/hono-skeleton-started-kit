import * as RbacRepository from "../../repositories/admin/rbac.repository.ts";
import type { Role, Permission } from "../../database/schema/admin/rbac.schema.ts";

/**
 * RBAC Service: High-level authorization logic.
 */

/**
 * Returns all permission codes granted to the user.
 * If user is Superadmin, returns wildcard '*' or all system permissions.
 */
export const getUserPermissions = async (userId: number): Promise<string[]> => {
  const roles = await RbacRepository.findUserRoles(userId);
  const isSuperadmin = roles.some((r) => r.name === "Superadmin");

  if (isSuperadmin) {
    const allPerms = await RbacRepository.findAllPermissions();
    return Array.from(new Set(["*", ...allPerms.map((p) => p.code)]));
  }

  return RbacRepository.findUserPermissions(userId);
};

/**
 * Checks whether a user possesses a specific permission.
 */
export const hasPermission = async (
  userId: number,
  permissionCode: string,
): Promise<boolean> => {
  const userPerms = await getUserPermissions(userId);
  return userPerms.includes("*") || userPerms.includes(permissionCode);
};

export const getUserRoles = async (userId: number): Promise<Role[]> => {
  return RbacRepository.findUserRoles(userId);
};

export const listAllRoles = async (): Promise<Role[]> => {
  return RbacRepository.findAllRoles();
};

export const listAllPermissions = async (): Promise<Permission[]> => {
  return RbacRepository.findAllPermissions();
};

export const assignRole = async (userId: number, roleId: number): Promise<void> => {
  await RbacRepository.assignRoleToUser(userId, roleId);
};

export const revokeRole = async (userId: number, roleId: number): Promise<void> => {
  await RbacRepository.removeRoleFromUser(userId, roleId);
};
