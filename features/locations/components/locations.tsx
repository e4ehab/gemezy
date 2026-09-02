'use client';

import { useSuspenseLocations } from '@/features/locations/hooks/use-locations';

export function Locations() {
  const { data: users } = useSuspenseLocations({ page: 1, pageSize: 10 });

  if (users.length === 0) {
    return <p>No users yet.</p>;
  }

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <strong>{user.name}</strong> ({user.email})
        </li>
      ))}
    </ul>
  );
}
