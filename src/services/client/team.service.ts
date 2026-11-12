import * as ClientService from "../admin/client.service.ts";
import * as RbacService from "../admin/rbac.service.ts";
import { ValidationError } from "../../utils/errors.util.ts";

/**
 * Team Service (Client Portal Domain):
 * Manages collaborators and permissions within a client workspace.
 */

export const listWorkspaceMembers = async (clientId: number) => {
  return ClientService.listMembers(clientId);
};

export const listClientRoles = async () => {
  return RbacService.listAllRoles("client");
};

export const inviteMemberToWorkspace = async (data: {
  clientId: number;
  name: string;
  email: string;
  roleId: number;
}) => {
  return ClientService.inviteMember(data);
};

export const removeMemberFromWorkspace = async (
  clientId: number,
  targetUserId: number,
  currentUserId: number,
) => {
  if (targetUserId === currentUserId) {
    throw new ValidationError("You cannot remove yourself from the organization.");
  }
  return ClientService.removeMemberByClientAndUser(clientId, targetUserId);
};
