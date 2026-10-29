-- A wallet can never hold a negative balance, whatever writes to it.
ALTER TABLE "account_wallets"
  ADD CONSTRAINT "account_wallets_coins_non_negative" CHECK ("coins" >= 0);

-- Lifetime counters only ever grow.
ALTER TABLE "account_wallets"
  ADD CONSTRAINT "account_wallets_lifetime_non_negative"
  CHECK ("lifetimeEarned" >= 0 AND "lifetimeSpent" >= 0);
