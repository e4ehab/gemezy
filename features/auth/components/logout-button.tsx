"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const onLogout = async () => {
    try {
      setIsPending(true);
      await authClient.signOut();
      router.refresh();
      router.push("/login");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button onClick={onLogout} disabled={isPending}>
      {isPending ? "Signing out..." : "Logout"}
    </Button>
  );
}
