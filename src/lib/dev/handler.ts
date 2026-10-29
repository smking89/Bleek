import "server-only";

import { AstroDataError } from "@astro/core/errors";
import { authenticateApiKey, recordApiRequest, todayUsage, type ApiKeyContext } from "./apps";
import { DAILY_QUOTA, type ScopeKey } from "./keys";

/**
 * Wraps every `/api/v1` handler: resolves the key, enforces scope and quota,
 * then records the call whether it succeeded or failed.
 */
export async function withDeveloperApi(
  request: Request,
  scope: ScopeKey,
  handler: (context: ApiKeyContext) => Promise<Response>,
): Promise<Response> {
  const startedAt = Date.now();

  let context: ApiKeyContext;
  try {
    context = await authenticateApiKey(request);
  } catch (error) {
    // No app to attribute the call to, so nothing is metered.
    return apiErrorResponse(error);
  }

  const finish = async (response: Response) => {
    try {
      await recordApiRequest({
        appId: context.app.id,
        request,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      console.error("[dev] could not record request", error);
    }
    return response;
  };

  if (!context.app.scopes.includes(scope)) {
    return finish(
      apiErrorResponse(
        new AstroDataError(`This key is missing the ${scope} scope.`, 403, "MISSING_SCOPE"),
      ),
    );
  }

  try {
    const used = await todayUsage(context.app.id);
    if (used >= DAILY_QUOTA) {
      return finish(
        apiErrorResponse(
          new AstroDataError(
            `This key has used its ${DAILY_QUOTA.toLocaleString()} request daily quota.`,
            429,
            "QUOTA_EXCEEDED",
          ),
        ),
      );
    }

    return finish(await handler(context));
  } catch (error) {
    return finish(apiErrorResponse(error));
  }
}

export function apiErrorResponse(error: unknown): Response {
  if (error instanceof AstroDataError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.error("[dev] unexpected api failure", error);
  return Response.json(
    { error: "The ASTRO API could not complete this request.", code: "INTERNAL" },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}
