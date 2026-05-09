-- Security fix: scope notes to owning user
ALTER TABLE "notes" ADD COLUMN "userId" TEXT;
CREATE INDEX "notes_userId_idx" ON "notes"("userId");
