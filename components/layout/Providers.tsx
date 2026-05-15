'use client';

import { AuthProvider } from '@/context/AuthContext';
import { AdminTabProvider } from '@/context/AdminTabContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminTabProvider>{children}</AdminTabProvider>
    </AuthProvider>
  );
}
