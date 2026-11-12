import { UnauthorizedError } from "../../utils/errors.util.ts";
import * as ClientUserRepository from "../../repositories/client/clientUser.repository.ts";
import type { ClientUser, ClientMembershipItem } from "../../repositories/client/clientUser.repository.ts";

export interface ClientLoginResult {
  user: ClientUser;
  activeClientId: number | null;
  workspaces: ClientMembershipItem[];
}

/**
 * Verifies email & password credentials for external client portal users.
 * Automatically checks account moderation status (banned/suspended/inactive)
 * and resolves the initial active workspace.
 */
export const verifyClientCredentials = async (
  email: string,
  rawPassword: string,
): Promise<ClientLoginResult> => {
  const genericError = new UnauthorizedError("Invalid email or password");
  const user = await ClientUserRepository.findClientUserByEmail(email);

  if (!user) {
    // Constant-time dummy verify to mitigate timing attacks
    await Bun.password.verify(rawPassword, "$argon2id$v=19$m=65536,t=2,p=1$dummyhash$dummyhash");
    throw genericError;
  }

  const matches = await Bun.password.verify(rawPassword, user.passwordHash);
  if (!matches) {
    throw genericError;
  }

  // Handle Account Moderation / Suspension / Ban
  if (user.status === "BANNED") {
    if (user.bannedUntil) {
      const expiry = new Date(user.bannedUntil.replace(" ", "T") + (user.bannedUntil.includes("Z") ? "" : "Z"));
      if (expiry <= new Date()) {
        // Auto-lift expired temporary ban
        await ClientUserRepository.updateClientUserStatus(user.id, {
          status: "ACTIVE",
          isActive: true,
          bannedUntil: null,
          statusReason: "Temporary ban restriction automatically lifted after expiration.",
        });
        user.status = "ACTIVE";
        user.isActive = true;
        user.bannedUntil = null;
      } else {
        const formattedExpiry = expiry.toLocaleString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const reasonMsg = user.statusReason ? ` Reason: "${user.statusReason}".` : "";
        throw new UnauthorizedError(
          `Your account has been temporarily suspended until ${formattedExpiry}.${reasonMsg}`,
        );
      }
    } else {
      const reasonMsg = user.statusReason ? ` Reason: "${user.statusReason}".` : "";
      throw new UnauthorizedError(
        `Your account has been permanently suspended by platform administration.${reasonMsg}`,
      );
    }
  }

  if (!user.isActive || user.status === "INACTIVE" || user.status === "SUSPENDED") {
    throw new UnauthorizedError("Your account has been deactivated. Please contact support.");
  }

  // Resolve Workspaces / Organizations
  const workspaces = await ClientUserRepository.findUserWorkspaces(user.id);
  let activeClientId: number | null = null;

  if (workspaces.length > 0) {
    const hasLastActive = workspaces.some((w) => w.clientId === user.lastActiveClientId);
    if (hasLastActive && user.lastActiveClientId) {
      activeClientId = user.lastActiveClientId;
    } else {
      activeClientId = workspaces[0]!.clientId;
      await ClientUserRepository.updateLastActiveClient(user.id, activeClientId);
    }
  }

  return {
    user,
    activeClientId,
    workspaces,
  };
};

/**
 * Switches the user's active organization/workspace.
 */
export const switchWorkspace = async (
  userId: number,
  targetClientId: number,
): Promise<ClientMembershipItem> => {
  const workspaces = await ClientUserRepository.findUserWorkspaces(userId);
  const target = workspaces.find((w) => w.clientId === targetClientId);

  if (!target) {
    throw new UnauthorizedError("You are not an active member of this organization.");
  }

  await ClientUserRepository.updateLastActiveClient(userId, targetClientId);
  return target;
};
