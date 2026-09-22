"use client";

import { useRouter } from "next/navigation";

import { useSuspenseLocations } from "@/features/locations/hooks/use-locations";
import { LogoutButton } from "@/features/auth/components/logout-button";
export function Locations() {
  const router = useRouter();

  const { data: users } = useSuspenseLocations({
    page: 1,
    pageSize: 10,
  });

  if (users.length === 0) {
    return (
      <div>
        <p>No users yet.</p>

        <LogoutButton />
      </div>
    );
  }


  return (
    <div>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <strong>{user.name}</strong> ({user.email})
          </li>
        ))}
      </ul>

      <LogoutButton />
    </div>
  );
}