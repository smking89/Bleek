import type { StaffRole } from "./admin/roles";
import type { Snapshot, User } from "./types";

/** The ASTRO account the Bleek client is running as, resolved server-side. */
export type AppIdentity = {
  handle: string;
  displayName: string;
  verified: boolean;
  staffRole: StaffRole | null;
  region: string | null;
  playPlatform: string | null;
};

function withMe(snapshot: Snapshot, me: User): Snapshot {
  return {
    ...snapshot,
    me,
    users: snapshot.users.map((user) => (user.id === snapshot.me.id ? me : user)),
  };
}

/**
 * Stamps the session's handle and verification state onto the local chat user.
 * The chat store starts empty; the ASTRO account is canonical.
 */
export function withHandle(snapshot: Snapshot, identity: AppIdentity): Snapshot {
  return withMe(snapshot, {
    ...snapshot.me,
    handle: identity.handle,
    verified: identity.verified,
    staffRole: identity.staffRole,
    region: identity.region,
    playPlatform: identity.playPlatform,
  });
}

/**
 * Full binding for a fresh snapshot: display name too, so every surface renders
 * the account's own name rather than a stand-in.
 */
export function withIdentity(snapshot: Snapshot, identity: AppIdentity): Snapshot {
  const displayName = identity.displayName.trim();
  const named: Snapshot = {
    ...snapshot,
    me: { ...snapshot.me, name: displayName.length > 0 ? displayName : snapshot.me.name },
  };
  return withHandle(named, identity);
}
