#!/usr/bin/env node
/**
 * Grants, changes or removes a staff role from a terminal.
 *
 *   npm run staff:grant -- <handle> [MODERATOR|ADMIN|SUPER_ADMIN]
 *   npm run staff:grant -- <handle> none
 *
 * This exists so the very first super admin can exist without a privileged API
 * route. Every later change should go through the console, which audits the actor.
 */

import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const ROLES = ["MODERATOR", "ADMIN", "SUPER_ADMIN"];

// Next.js loads .env for the app; a plain node script does not.
if (!process.env.DATABASE_URL) {
  try {
    const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match || line.trim().startsWith("#")) continue;
      const [, key, rawValue] = match;
      const value = rawValue.replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // No .env file: DATABASE_URL must already be in the environment.
  }
}

const [handleArg, roleArg = "SUPER_ADMIN"] = process.argv.slice(2);

if (!handleArg) {
  console.error("Usage: npm run staff:grant -- <handle> [MODERATOR|ADMIN|SUPER_ADMIN|none]");
  process.exit(1);
}

const handle = handleArg.trim().replace(/^@+/, "").toLowerCase();
if (!/^[a-z0-9][a-z0-9._-]{1,31}$/.test(handle)) {
  console.error(`"${handleArg}" is not a valid ASTRO handle.`);
  process.exit(1);
}

const requested = roleArg.trim().toUpperCase();
if (requested !== "NONE" && !ROLES.includes(requested)) {
  console.error(`Unknown role "${roleArg}". Use MODERATOR, ADMIN, SUPER_ADMIN or none.`);
  process.exit(1);
}

const role = requested === "NONE" ? null : requested;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env or export it first.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { handle },
    select: { id: true, handle: true, displayName: true, staffRole: true, staffSince: true, staffTitle: true },
  });

  if (!user) {
    console.error(`No ASTRO account for @${handle}. Register it first at /#access.`);
    process.exitCode = 1;
  } else {
    if (role === null && user.staffRole === "SUPER_ADMIN") {
      const supers = await prisma.user.count({ where: { staffRole: "SUPER_ADMIN" } });
      if (supers <= 1) {
        console.error("Refusing to remove the last super admin. Grant the role to someone else first.");
        process.exitCode = 1;
      }
    }

    if (process.exitCode !== 1) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          staffRole: role,
          staffSince: role ? (user.staffSince ?? new Date()) : null,
          staffTitle: role ? (user.staffTitle ?? role.replace("_", " ").toLowerCase()) : null,
        },
        select: { handle: true, staffRole: true },
      });

      await prisma.staffAudit.create({
        data: {
          actorHandle: "system:cli",
          actorRole: null,
          action: role ? "staff.granted_via_cli" : "staff.role_removed_via_cli",
          targetType: "user",
          targetId: user.id,
          targetLabel: `@${user.handle}`,
          summary: role
            ? `CLI granted ${role} to @${user.handle}`
            : `CLI removed ${user.staffRole ?? "staff"} role from @${user.handle}`,
          metadata: { from: user.staffRole, to: role },
        },
      });

      console.log(`@${updated.handle} → ${updated.staffRole ?? "no staff role"}`);
    }
  }
} finally {
  await prisma.$disconnect();
}
