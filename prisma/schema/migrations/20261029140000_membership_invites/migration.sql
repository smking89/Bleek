-- Invite codes make a server joinable, and chat_memberships records everyone who
-- joined with one. Existing servers receive a code during the backfill so no row
-- is left unreachable.
ALTER TABLE "chat_servers" ADD COLUMN "inviteCode" TEXT;

UPDATE "chat_servers"
SET "inviteCode" = upper(substr(md5("id" || random()::text), 1, 8))
WHERE "inviteCode" IS NULL;

ALTER TABLE "chat_servers" ALTER COLUMN "inviteCode" SET NOT NULL;
CREATE UNIQUE INDEX "chat_servers_inviteCode_key" ON "chat_servers"("inviteCode");

CREATE TABLE "chat_memberships" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_memberships_serverId_memberId_key" ON "chat_memberships"("serverId", "memberId");
CREATE INDEX "chat_memberships_memberId_joinedAt_idx" ON "chat_memberships"("memberId", "joinedAt");

ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_serverId_fkey"
  FOREIGN KEY ("serverId") REFERENCES "chat_servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_memberships" ADD CONSTRAINT "chat_memberships_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "chat_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
