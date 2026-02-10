'use client';

import { useEffect, useState } from 'react';

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        setIsAdmin(Boolean(data?.isAdmin));
      } catch (e) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  return isAdmin;
}
