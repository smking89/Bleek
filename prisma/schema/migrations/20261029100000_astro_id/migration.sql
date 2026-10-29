-- ASTROid: signed, tamper-evident identifier minted at registration.
ALTER TABLE "users" ADD COLUMN "astroId" TEXT;

CREATE UNIQUE INDEX "users_astroId_key" ON "users"("astroId");
