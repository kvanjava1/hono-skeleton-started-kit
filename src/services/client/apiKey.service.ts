import * as ApiKeyRepository from "../../repositories/client/apiKey.repository.ts";
import * as RbacRepository from "../../repositories/admin/rbac.repository.ts";
import { generateApiKey, hashApiKey } from "../../utils/apiKey.util.ts";
import { ACCOUNT_STATUSES } from "../../database/schema/common/status.schema.ts";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/errors.util.ts";
import { logger } from "../../utils/logger.util.ts";

export interface CreateApiKeyResult {
  id: number;
  name: string;
  keyPrefix: string;
  rawToken: string;
  status: string;
  createdAt: string;
}

export const createApiKey = async (
  clientId: number,
  userId: number,
  name: string,
  permissionCodes: string[] = [],
): Promise<CreateApiKeyResult> => {
  const { rawToken, keyPrefix, secretHash } = generateApiKey();

  // Resolve permission IDs from codes if any scopes specified
  let permissionIds: number[] = [];
  if (permissionCodes.length > 0) {
    const allPerms = await RbacRepository.findAllPermissions();
    permissionIds = allPerms
      .filter((p) => permissionCodes.includes(p.code))
      .map((p) => p.id);
  }

  const created = await ApiKeyRepository.insertApiKey(
    {
      clientId,
      createdBy: userId,
      name,
      keyPrefix,
      secretHash,
      status: ACCOUNT_STATUSES.ACTIVE,
    },
    permissionIds,
  );

  logger.info("[ApiKeyService] API key generated", {
    id: created.id,
    clientId,
    keyPrefix,
  });

  return {
    id: created.id,
    name: created.name,
    keyPrefix: created.keyPrefix,
    rawToken, // Revealed only once to caller
    status: created.status,
    createdAt: created.createdAt,
  };
};

export const verifyApiKey = async (rawToken: string) => {
  if (!rawToken || !rawToken.startsWith("hon_live_")) {
    throw new UnauthorizedError("Invalid API key format.");
  }

  const hash = hashApiKey(rawToken);
  const result = await ApiKeyRepository.findApiKeyByHash(hash);

  if (!result) {
    throw new UnauthorizedError("Invalid API key.");
  }

  const { key, client } = result;

  // 1. Verify Client Status
  if (client.status !== ACCOUNT_STATUSES.ACTIVE) {
    throw new ForbiddenError(
      `Client organization "${client.name}" is ${client.status.toLowerCase()}. Access denied.`,
    );
  }

  // 2. Verify Key Status
  if (key.status !== ACCOUNT_STATUSES.ACTIVE) {
    throw new ForbiddenError(
      `API key "${key.name}" is ${key.status.toLowerCase()}.`,
    );
  }

  // 3. Verify Key Expiration if set
  if (key.expiresAt && new Date(key.expiresAt).getTime() < Date.now()) {
    throw new UnauthorizedError("API key has expired.");
  }

  // 4. Retrieve fine-grained permissions for this key (if scopes configured)
  const scopedPermissions = await ApiKeyRepository.findApiKeyPermissions(key.id);

  // If no specific scopes were restricted on the key, it inherits full client permissions
  const effectivePermissions =
    scopedPermissions.length > 0
      ? scopedPermissions
      : ["*"]; // default wildcard for client keys

  // Touch lastUsedAt asynchronously
  ApiKeyRepository.touchApiKeyLastUsed(key.id).catch((err) =>
    logger.warn("[ApiKeyService] Failed to touch lastUsedAt", { error: err }),
  );

  return {
    key,
    client,
    permissions: effectivePermissions,
  };
};

export const revokeApiKey = async (id: number, clientId: number): Promise<void> => {
  const keys = await ApiKeyRepository.findApiKeysByClientId(clientId);
  const target = keys.find((k) => k.id === id);
  if (!target) {
    throw new NotFoundError("API key not found.");
  }

  await ApiKeyRepository.updateApiKeyStatus(id, ACCOUNT_STATUSES.INACTIVE);
  logger.info("[ApiKeyService] API key revoked", { id, clientId });
};

export const listClientApiKeys = async (clientId: number) => {
  return ApiKeyRepository.findApiKeysByClientId(clientId);
};
