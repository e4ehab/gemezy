CREATE TYPE "FriendReportCategory" AS ENUM (
    'SPAM',
    'HARASSMENT',
    'INAPPROPRIATE_CONTENT',
    'OTHER'
);

CREATE TYPE "FriendReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

CREATE TABLE "friend_block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_block_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "friend_report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "category" "FriendReportCategory" NOT NULL,
    "details" TEXT,
    "status" "FriendReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_report_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "friend_block_blocker_blocked_key"
ON "friend_block"("blockerId", "blockedId");

CREATE INDEX "friend_block_blockedId_idx"
ON "friend_block"("blockedId");

CREATE INDEX "friend_report_status_createdAt_idx"
ON "friend_report"("status", "createdAt");

CREATE INDEX "friend_report_reporterId_reportedId_createdAt_idx"
ON "friend_report"("reporterId", "reportedId", "createdAt");

ALTER TABLE "friend_block"
ADD CONSTRAINT "friend_block_blockerId_fkey"
FOREIGN KEY ("blockerId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "friend_block"
ADD CONSTRAINT "friend_block_blockedId_fkey"
FOREIGN KEY ("blockedId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "friend_report"
ADD CONSTRAINT "friend_report_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "friend_report"
ADD CONSTRAINT "friend_report_reportedId_fkey"
FOREIGN KEY ("reportedId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
