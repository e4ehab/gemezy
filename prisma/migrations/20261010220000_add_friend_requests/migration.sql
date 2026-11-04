CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

CREATE TABLE "friend_request" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "friend_request_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "friend_request_sender_recipient_key"
ON "friend_request"("senderId", "recipientId");

CREATE INDEX "friend_request_recipientId_status_createdAt_idx"
ON "friend_request"("recipientId", "status", "createdAt");

CREATE INDEX "friend_request_senderId_status_createdAt_idx"
ON "friend_request"("senderId", "status", "createdAt");

ALTER TABLE "friend_request"
ADD CONSTRAINT "friend_request_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "friend_request"
ADD CONSTRAINT "friend_request_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
