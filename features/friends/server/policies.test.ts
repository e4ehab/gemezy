import assert from "node:assert/strict";
import test from "node:test";
import {
  canRemoveFriendship,
  canCancelFriendRequest,
  canSendFriendRequest,
  canRespondToFriendRequest,
  canViewPublicLocations,
  canViewFriendsOnlyLocations,
  getFriendVisibleLocationVisibilities,
  classifyRequestPair,
  getFriendRequestResponseStatus,
  isLocationVisibleToFriend,
} from "./policies";

test("a new pair can send a friend request", () => {
  assert.deepEqual(classifyRequestPair("alice", []), { kind: "new" });
  assert.equal(canSendFriendRequest(false), true);
  assert.equal(canSendFriendRequest(true), false);
});

test("duplicate pending requests are distinguished by direction", () => {
  const outgoing = {
    id: "out",
    senderId: "alice",
    recipientId: "bob",
    status: "PENDING" as const,
  };
  const incoming = { ...outgoing, id: "in", senderId: "bob", recipientId: "alice" };

  assert.deepEqual(classifyRequestPair("alice", [outgoing]), {
    kind: "pending-outgoing",
  });
  assert.deepEqual(classifyRequestPair("alice", [incoming]), {
    kind: "pending-incoming",
  });
});

test("an accepted request prevents duplicate friendship creation", () => {
  assert.deepEqual(
    classifyRequestPair("alice", [
      {
        id: "accepted",
        senderId: "bob",
        recipientId: "alice",
        status: "ACCEPTED",
      },
    ]),
    { kind: "accepted" },
  );
});

test("a declined outgoing request can be retried", () => {
  assert.deepEqual(
    classifyRequestPair("alice", [
      {
        id: "declined",
        senderId: "alice",
        recipientId: "bob",
        status: "DECLINED",
      },
    ]),
    { kind: "retry-outgoing", requestId: "declined" },
  );
});

test("only the recipient may accept or decline a pending request", () => {
  const pending = { recipientId: "bob", status: "PENDING" as const };
  assert.equal(canRespondToFriendRequest(pending, "bob"), true);
  assert.equal(canRespondToFriendRequest(pending, "alice"), false);
  assert.equal(canRespondToFriendRequest({ ...pending, status: "ACCEPTED" }, "bob"), false);
  assert.equal(canRespondToFriendRequest({ ...pending, status: "DECLINED" }, "bob"), false);
});

test("accept and decline are valid request transitions only from pending", () => {
  assert.equal(getFriendRequestResponseStatus("PENDING", true, "ACCEPTED"), "ACCEPTED");
  assert.equal(getFriendRequestResponseStatus("PENDING", true, "DECLINED"), "DECLINED");
  assert.equal(getFriendRequestResponseStatus("PENDING", false, "ACCEPTED"), null);
  assert.equal(getFriendRequestResponseStatus("ACCEPTED", true, "DECLINED"), null);
});

test("only the sender may cancel a pending request", () => {
  const pending = { senderId: "alice", status: "PENDING" as const };
  assert.equal(canCancelFriendRequest(pending, "alice"), true);
  assert.equal(canCancelFriendRequest(pending, "bob"), false);
  assert.equal(canCancelFriendRequest({ ...pending, status: "DECLINED" }, "alice"), false);
});

test("public locations are visible before friendship unless either user is blocked", () => {
  assert.equal(canViewPublicLocations(false), true);
  assert.equal(canViewPublicLocations(true), false);
});

test("friends-only locations require an accepted friendship", () => {
  assert.equal(canViewFriendsOnlyLocations(true), true);
  assert.equal(canViewFriendsOnlyLocations(false), false);
  assert.deepEqual(getFriendVisibleLocationVisibilities(false), ["PUBLIC"]);
  assert.deepEqual(getFriendVisibleLocationVisibilities(true), ["PUBLIC", "FRIENDS_ONLY"]);
});

test("only an accepted friendship can be removed", () => {
  assert.equal(canRemoveFriendship("ACCEPTED"), true);
  assert.equal(canRemoveFriendship("PENDING"), false);
  assert.equal(canRemoveFriendship("DECLINED"), false);
});

test("public and friends-only locations are eligible for a friend's collection", () => {
  assert.equal(isLocationVisibleToFriend("PUBLIC"), true);
  assert.equal(isLocationVisibleToFriend("FRIENDS_ONLY"), true);
  assert.equal(isLocationVisibleToFriend("PRIVATE"), false);
  assert.equal(isLocationVisibleToFriend("SHARED"), false);
  assert.equal(isLocationVisibleToFriend("Unlisted"), false);
});
