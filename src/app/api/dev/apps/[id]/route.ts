import {
  deleteApp,
  rotateAppSecret,
  setAppStatus,
  updateApp,
} from "@/lib/dev/apps";
import { developerAccount } from "@/lib/dev/account";
import { astroErrorResponse, readJson } from "@astro/core/http";

export const dynamic = "force-dynamic";

type Body = {
  action?: string;
  name?: unknown;
  description?: unknown;
  environment?: unknown;
  scopes?: unknown;
  redirectUri?: unknown;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await developerAccount();
    const { id } = await params;
    const body = await readJson<Body>(request);

    switch (body.action) {
      case "rotate":
        return Response.json(await rotateAppSecret(account.id, id));

      case "update":
        return Response.json({
          app: await updateApp(account.id, id, {
            name: body.name,
            description: body.description,
            environment: body.environment,
            scopes: body.scopes,
            redirectUri: body.redirectUri,
          }),
        });

      case "revoke":
        return Response.json({ app: await setAppStatus(account.id, id, "REVOKED") });

      case "restore":
        return Response.json({ app: await setAppStatus(account.id, id, "ACTIVE") });

      default:
        return Response.json(
          { error: "action must be rotate, update, revoke or restore.", code: "INVALID_ACTION" },
          { status: 422 },
        );
    }
  } catch (error) {
    return astroErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await developerAccount();
    const { id } = await params;
    return Response.json(await deleteApp(account.id, id));
  } catch (error) {
    return astroErrorResponse(error);
  }
}
