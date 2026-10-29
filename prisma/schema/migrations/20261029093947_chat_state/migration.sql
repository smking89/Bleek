-- CreateTable
CREATE TABLE "chat_members" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "region" TEXT,
    "playPlatform" TEXT,
    "status" TEXT NOT NULL DEFAULT 'online',
    "avatarFrom" TEXT NOT NULL DEFAULT '#4f46e5',
    "avatarTo" TEXT NOT NULL DEFAULT '#06b6d4',
    "banner" TEXT[],
    "bio" TEXT NOT NULL DEFAULT '',
    "pronouns" TEXT NOT NULL DEFAULT '',
    "customStatus" TEXT,
    "character" TEXT NOT NULL DEFAULT 'comet',
    "cosmetics" JSONB NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "owned" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_servers" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#4f46e5',
    "position" INTEGER NOT NULL DEFAULT 0,
    "roles" JSONB NOT NULL,
    "guard" JSONB NOT NULL,
    "flagged" JSONB NOT NULL DEFAULT '[]',
    "storefront" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_channels" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "topic" TEXT,
    "layout" TEXT,
    "doc" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "reactions" JSONB NOT NULL DEFAULT '[]',
    "replyTo" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_gifts" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_payouts" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "creatorShare" INTEGER NOT NULL,
    "platformShare" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_members_handle_key" ON "chat_members"("handle");

-- CreateIndex
CREATE INDEX "chat_members_joinedAt_idx" ON "chat_members"("joinedAt");

-- CreateIndex
CREATE INDEX "chat_servers_ownerId_position_idx" ON "chat_servers"("ownerId", "position");

-- CreateIndex
CREATE INDEX "chat_channels_serverId_position_idx" ON "chat_channels"("serverId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "chat_channels_serverId_name_key" ON "chat_channels"("serverId", "name");

-- CreateIndex
CREATE INDEX "chat_messages_channelId_createdAt_idx" ON "chat_messages"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_authorId_idx" ON "chat_messages"("authorId");

-- CreateIndex
CREATE INDEX "chat_gifts_createdAt_idx" ON "chat_gifts"("createdAt");

-- CreateIndex
CREATE INDEX "chat_payouts_serverId_createdAt_idx" ON "chat_payouts"("serverId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_payouts_creatorId_idx" ON "chat_payouts"("creatorId");

-- AddForeignKey
ALTER TABLE "chat_servers" ADD CONSTRAINT "chat_servers_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "chat_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "chat_servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "chat_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_gifts" ADD CONSTRAINT "chat_gifts_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "chat_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_gifts" ADD CONSTRAINT "chat_gifts_toId_fkey" FOREIGN KEY ("toId") REFERENCES "chat_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
