import { Hono } from "hono";
import { ROUTES } from "../../../configs/routes.config.ts";
import { authGuard } from "../../../middlewares/web/auth.middleware.ts";
import { showAdminLogsIndex } from "../../../controllers/web/admin/logs.controller.ts";

export const adminLogsWebRoutes = new Hono();

adminLogsWebRoutes.get(ROUTES.WEB.ADMIN.LOGS, authGuard, showAdminLogsIndex);
