'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Skip login page for the login route itself
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const checkAuth = () => {
      const adminSession = localStorage.getItem('admin_session');
      if (adminSession) {
        const session = JSON.parse(adminSession);
        if (session.expires > Date.now()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('admin_session');
          if (!isLoginPage) {
            router.push('/admin/login');
          }
        }
      } else {
        if (!isLoginPage) {
          router.push('/admin/login');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router, isLoginPage]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If on login page or authenticated, render children
  if (isLoginPage || isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated and not on login page, return null (redirect happens in useEffect)
  return null;
}