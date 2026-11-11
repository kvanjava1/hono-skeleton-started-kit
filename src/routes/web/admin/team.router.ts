import { Hono } from "hono";
import {
  showTeamIndex,
  inviteTeamMemberFromWeb,
  removeTeamMemberFromWeb,
} from "../../../controllers/web/admin/team.controller.ts";
import { authGuard } from "../../../middlewares/web/auth.middleware.ts";
import { csrfGuard } from "../../../middlewares/web/sameOrigin.middleware.ts";
import { can } from "../../../middlewares/common/can.middleware.ts";
import { ROUTES } from "../../../configs/routes.config.ts";

export const teamRouter = new Hono();

teamRouter.get(
  ROUTES.WEB.ADMIN.TEAM,
  authGuard,
  can("team.view"),
  showTeamIndex,
);
teamRouter.post(
  ROUTES.WEB.ADMIN.TEAM_INVITE,
  csrfGuard,
  authGuard,
  can("team.invite"),
  inviteTeamMemberFromWeb,
);
teamRouter.delete(
  ROUTES.WEB.ADMIN.TEAM_REMOVE,
  csrfGuard,
  authGuard,
  can("team.remove"),
  removeTeamMemberFromWeb,
);
