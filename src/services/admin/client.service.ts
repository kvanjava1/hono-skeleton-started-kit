import * as ClientRepository from "../../repositories/admin/client.repository.ts";
import * as ClientUserRepository from "../../repositories/client/clientUser.repository.ts";
import * as RbacRepository from "../../repositories/admin/rbac.repository.ts";
import * as ClientStatusHistoryRepository from "../../repositories/admin/clientStatusHistory.repository.ts";
import { ConflictError, NotFoundError, ValidationError } from "../../utils/errors.util.ts";
import { logger } from "../../utils/logger.util.ts";
import { recordActivity } from "../common/activityLog.service.ts";
import type { CreateClientInput, UpdateClientInput } from "../../validations/admin/client.ts";
import { ACCOUNT_STATUSES, type AccountStatusCode } from "../../database/schema/common/status.schema.ts";
import { PASSWORD_HASH_OPTIONS } from "./user.service.ts";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const listClients = async (query: ClientRepository.ClientListQuery) => {
  return ClientRepository.findAllClients(query);
};

export const findClient = async (id: number) => {
  const client = await ClientRepository.findClientById(id);
  if (!client) {
    throw new NotFoundError(`Client with ID ${id} not found.`);
  }
  const members = await ClientRepository.findClientMembers(id);
  const apiKeys = await ClientRepository.findClientApiKeys(id);

  return {
    ...client,
    members,
    apiKeys,
  };
};

export const createClient = async (input: CreateClientInput) => {
  let slug = input.slug || generateSlug(input.name);
  if (!slug) slug = `client-${Date.now()}`;

  // Check unique slug
  const existingSlug = await ClientRepository.findClientBySlug(slug);
  if (existingSlug) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Create client
  const client = await ClientRepository.insertClient({
    name: input.name,
    slug,
    status: input.status ?? ACCOUNT_STATUSES.ACTIVE,
  });

  logger.info("[ClientService] Client created successfully", {
    id: client.id,
    name: client.name,
  });

  recordActivity({
    clientId: client.id,
    action: "client.create",
    scope: "global",
    description: `Created organization "${client.name}"`,
  });

  return client;
};

export const updateClient = async (id: number, input: UpdateClientInput) => {
  await findClient(id);
  const updated = await ClientRepository.updateClientById(id, input);
  if (!updated) {
    throw new NotFoundError(`Client with ID ${id} not found.`);
  }
  logger.info("[ClientService] Client updated", {
    id: updated.id,
    name: updated.name,
    status: updated.status,
  });
  return updated;
};

export interface ChangeClientStatusInput {
  status: AccountStatusCode;
  reason?: string | null;
  suspendedUntil?: string | null;
  actingUserId?: number;
}

export const changeClientStatus = async (
  id: number,
  input: ChangeClientStatusInput,
) => {
  const current = await findClient(id);

  const suspendedUntil = input.status === "SUSPENDED" ? (input.suspendedUntil ?? null) : null;
  const statusReason = input.status !== "ACTIVE" ? (input.reason ?? null) : null;

  try {
    await ClientStatusHistoryRepository.insertClientStatusHistory({
      clientId: id,
      fromStatus: current.status ?? "ACTIVE",
      toStatus: input.status,
      reason: input.reason ?? null,
      suspendedUntil,
      changedBy: input.actingUserId ?? null,
    });
  } catch {
    // Non-fatal if history table is unavailable in standalone tests
  }

  const updated = await ClientRepository.updateClientById(id, {
    status: input.status,
    suspendedUntil,
    statusReason,
  });

  if (!updated) {
    throw new NotFoundError(`Client with ID ${id} not found.`);
  }

  logger.info("[ClientService] Client status changed", {
    clientId: id,
    from: current.status,
    to: input.status,
    changedBy: input.actingUserId,
  });

  recordActivity({
    clientId: id,
    actorId: input.actingUserId,
    actorType: "admin",
    action: "client.status_change",
    scope: "organization",
    description: `Organization status changed to ${input.status}${input.reason ? ` (${input.reason})` : ""}`,
    metadata: {
      fromStatus: current.status,
      toStatus: input.status,
      reason: input.reason ?? null,
      suspendedUntil: suspendedUntil ?? null,
    },
  });

  return updated;
};

export const getClientStatusHistory = async (clientId: number) => {
  await findClient(clientId);
  return ClientStatusHistoryRepository.findClientStatusHistoriesByClientId(clientId);
};

export const setClientStatus = async (
  id: number,
  status: AccountStatusCode,
  actingUserId?: number,
) => {
  return changeClientStatus(id, { status, actingUserId });
};

export const deleteClient = async (id: number) => {
  await findClient(id);
  const deleted = await ClientRepository.softDeleteClientById(id);
  logger.info("[ClientService] Client soft-deleted", { id });
  return deleted;
};

export const getClientStats = async (
  clientId: number,
): Promise<{ totalApiKeys: number; totalMembers: number }> => {
  const [totalApiKeys, totalMembers] = await Promise.all([
    ClientRepository.countClientApiKeys(clientId),
    ClientRepository.countClientMembers(clientId),
  ]);
  return { totalApiKeys, totalMembers };
};

export const findClientByUserId = async (userId: number) => {
  return ClientRepository.findClientByUserId(userId);
};

export const resolveClientForUser = async (userId: number) => {
  const client = await ClientRepository.findClientByUserId(userId);
  if (client) return client;

  const all = await ClientRepository.findAllClients({ perPage: 1 });
  return all.rows[0] ?? null;
};

export const listMembers = async (clientId: number) => {
  return ClientRepository.findClientMembers(clientId);
};

export const findMember = async (memberId: number) => {
  const member = await ClientRepository.findClientMemberById(memberId);
  if (!member) {
    throw new NotFoundError(`Member with ID ${memberId} not found.`);
  }
  return member;
};

export const inviteMember = async (data: {
  clientId: number;
  name: string;
  email: string;
  roleId: number;
  password?: string;
  status?: string;
}) => {
  const client = await ClientRepository.findClientById(data.clientId);
  if (!client) {
    throw new NotFoundError(`Client with ID ${data.clientId} not found.`);
  }

  const role = await RbacRepository.findRoleById(data.roleId);
  if (!role || role.type !== "client") {
    throw new ValidationError("Invalid organization role selected.");
  }

  let user = await ClientUserRepository.findClientUserByEmail(data.email);
  if (!user) {
    const rawPassword = data.password || Bun.randomUUIDv7();
    const passwordHash = await Bun.password.hash(rawPassword, PASSWORD_HASH_OPTIONS);
    user = await ClientUserRepository.createClientUser({
      name: data.name,
      email: data.email,
      passwordHash,
      lastActiveClientId: client.id,
    });
  }

  const existingMembership = await ClientRepository.findMembership(client.id, user.id);
  if (existingMembership) {
    throw new ConflictError("User is already a member of this client.");
  }

  const membership = await ClientRepository.insertClientMember({
    clientId: client.id,
    userId: user.id,
    roleId: role.id,
    status: data.status ?? ACCOUNT_STATUSES.ACTIVE,
  });

  logger.info("[ClientService] Member invited successfully", {
    clientId: client.id,
    userId: user.id,
    membershipId: membership.id,
  });

  return { membership, user, client };
};

export const updateMember = async (
  memberId: number,
  data: {
    name?: string;
    email?: string;
    roleId?: number;
    status?: string;
    password?: string;
  },
) => {
  const member = await findMember(memberId);

  // Update user profile if changed
  const userPatch: Record<string, any> = {};
  if (data.name && data.name !== member.name) {
    userPatch.name = data.name;
  }
  if (data.email && data.email !== member.email) {
    const existing = await ClientUserRepository.findClientUserByEmail(data.email);
    if (existing && existing.id !== member.userId) {
      throw new ConflictError("Email already in use by another user.");
    }
    userPatch.email = data.email;
  }
  if (data.password) {
    userPatch.passwordHash = await Bun.password.hash(data.password, PASSWORD_HASH_OPTIONS);
  }
  if (Object.keys(userPatch).length > 0) {
    await ClientUserRepository.updateClientUser(member.userId, userPatch);
  }

  // Update membership if roleId or status changed
  const memberPatch: Record<string, any> = {};
  if (data.roleId !== undefined && data.roleId !== member.roleId) {
    const role = await RbacRepository.findRoleById(data.roleId);
    if (!role || role.type !== "client") {
      throw new ValidationError("Invalid organization role selected.");
    }
    memberPatch.roleId = data.roleId;
  }
  if (data.status && data.status !== member.status) {
    memberPatch.status = data.status;
  }
  if (Object.keys(memberPatch).length > 0) {
    await ClientRepository.updateClientMemberById(memberId, memberPatch);
  }

  logger.info("[ClientService] Member updated successfully", { memberId });
  return findMember(memberId);
};

export const toggleMemberStatus = async (memberId: number) => {
  const member = await findMember(memberId);
  const nextStatus = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await ClientRepository.updateClientMemberById(memberId, { status: nextStatus });
  logger.info("[ClientService] Member status toggled", { memberId, status: nextStatus });
  return { ...member, status: nextStatus };
};

export const removeMember = async (memberId: number): Promise<boolean> => {
  await findMember(memberId);
  const deleted = await ClientRepository.deleteClientMember(memberId);
  logger.info("[ClientService] Member removed", { memberId });
  return deleted;
};

export const removeMemberByClientAndUser = async (
  clientId: number,
  userId: number,
): Promise<boolean> => {
  const deleted = await ClientRepository.deleteClientMemberByClientAndUser(clientId, userId);
  if (!deleted) {
    throw new NotFoundError("Member not found in organization.");
  }
  logger.info("[ClientService] Member removed by client & user", { clientId, userId });
  return deleted;
};
