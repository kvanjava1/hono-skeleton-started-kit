import * as ActivityLogRepository from "../../repositories/common/activityLog.repository.ts";
import { logger } from "../../utils/logger.util.ts";

export interface RecordActivityInput {
  clientId?: number | null;
  actorId?: number | null;
  actorType?: "admin" | "client_user" | "system" | "api_key";
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  scope?: "global" | "organization" | "personal";
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Records a business/security activity event to the database audit trail.
 * Executed non-blocking so any database logging issues never interrupt business operations.
 */
export const recordActivity = async (
  input: RecordActivityInput,
): Promise<void> => {
  try {
    await ActivityLogRepository.insertActivityLog({
      clientId: input.clientId ?? null,
      actorId: input.actorId ?? null,
      actorType: input.actorType ?? "client_user",
      actorName: input.actorName ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      scope: input.scope ?? (input.clientId ? "organization" : "global"),
      description: input.description,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
  } catch (error) {
    logger.warn("[ActivityLogService] Failed to record activity log", {
      action: input.action,
      error,
    });
  }
};

/**
 * Global Admin Audit Logs:
 * Superadmins can inspect all events across tenants and users with filters.
 */
export const listAdminLogs = async (
  query: ActivityLogRepository.ActivityLogQuery,
) => {
  return ActivityLogRepository.findActivityLogs(query);
};

/**
 * Organization Audit Trail:
 * Scoped strictly to the active client organization.
 * Only returns organization-level and global events belonging to this client.
 */
export const listClientLogs = async (
  clientId: number,
  query: ActivityLogRepository.ActivityLogQuery,
) => {
  return ActivityLogRepository.findActivityLogs({
    ...query,
    clientId,
    scopes: ["organization", "global"],
  });
};

/**
 * User Personal Security Activity:
 * Scoped strictly to the authenticated user's own events (logins, security changes).
 */
export const listUserActivity = async (
  actorId: number,
  actorType: "admin" | "client_user",
  query: ActivityLogRepository.ActivityLogQuery,
) => {
  return ActivityLogRepository.findActivityLogs({
    ...query,
    actorId,
    actorType,
  });
};
