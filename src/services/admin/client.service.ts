import * as ClientRepository from "../../repositories/admin/client.repository.ts";
import * as UserRepository from "../../repositories/admin/user.repository.ts";
import * as RbacRepository from "../../repositories/admin/rbac.repository.ts";
import { getDrizzleDb } from "../../database/drizzle.ts";
import { clientMembers } from "../../database/schema/client/client.schema.ts";
import { ConflictError, NotFoundError } from "../../utils/errors.util.ts";
import { logger } from "../../utils/logger.util.ts";
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

  return client;
};

export const updateClient = async (id: number, input: UpdateClientInput) => {
  await findClient(id);
  const updated = await ClientRepository.updateClientById(id, input);
  if (!updated) {
    throw new NotFoundError(`Client with ID ${id} not found.`);
  }
  return updated;
};

export const setClientStatus = async (id: number, status: AccountStatusCode) => {
  await findClient(id);
  const updated = await ClientRepository.updateClientById(id, { status });
  logger.info("[ClientService] Client status updated", { id, status });
  return updated;
};

export const deleteClient = async (id: number) => {
  await findClient(id);
  const deleted = await ClientRepository.softDeleteClientById(id);
  logger.info("[ClientService] Client soft-deleted", { id });
  return deleted;
};
