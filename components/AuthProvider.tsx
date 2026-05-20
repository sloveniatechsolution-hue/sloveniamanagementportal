'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, operators } = useStore();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const isPublicPage = pathname === '/' || pathname === '/register' || pathname === '/login';
    
    if (!currentUser && !isPublicPage) {
      router.push('/login');
      return;
    }

    if (currentUser?.role === 'operator') {
      const operator = operators.find(op => op.id === currentUser.id);
      if (operator) {
        const missingDetails = !operator.bankDetails || !operator.idDocument;
        if (missingDetails && pathname !== '/profile') {
          router.push('/profile');
        }
      }
    }
  }, [currentUser, isClient, pathname, router, operators]);

  if (!isClient) return null; // Prevent hydration mismatch

  const isPublicPage = pathname === '/' || pathname === '/register' || pathname === '/login';

  if (currentUser || isPublicPage) {
    return <>{children}</>;
  }

  // Fallback while redirecting
  return null;
}
