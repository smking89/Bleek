import { actorId } from "@/lib/actor";
import { errorResponse, updateProfile } from "@/lib/store";
import type { CharacterKey, Cosmetics, Status } from "@/lib/types";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      bio?: string;
      pronouns?: string;
      status?: Status;
      customStatus?: string;
      character?: CharacterKey;
      banner?: [string, string];
      cosmetics?: Partial<Cosmetics>;
    };
    return Response.json(await updateProfile(await actorId(), body));
  } catch (error) {
    return errorResponse(error);
  }
}
