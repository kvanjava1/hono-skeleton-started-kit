import { Hono } from "hono";
import {
  showApiKeysIndex,
  createApiKeyFromWeb,
  revokeApiKeyFromWeb,
} from "../../../controllers/web/admin/apiKey.controller.ts";
import { authGuard } from "../../../middlewares/web/auth.middleware.ts";
import { csrfGuard } from "../../../middlewares/web/sameOrigin.middleware.ts";
import { can } from "../../../middlewares/common/can.middleware.ts";
import { ROUTES } from "../../../configs/routes.config.ts";

export const apiKeyRouter = new Hono();

apiKeyRouter.get(
  ROUTES.WEB.ADMIN.API_KEYS,
  authGuard,
  can("apikeys.view"),
  showApiKeysIndex,
);
apiKeyRouter.post(
  ROUTES.WEB.ADMIN.API_KEYS_CREATE,
  csrfGuard,
  authGuard,
  can("apikeys.create"),
  createApiKeyFromWeb,
);
apiKeyRouter.post(
  ROUTES.WEB.ADMIN.API_KEYS_REVOKE,
  csrfGuard,
  authGuard,
  can("apikeys.revoke"),
  revokeApiKeyFromWeb,
);
