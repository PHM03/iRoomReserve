'use client';

import React, { createContext, useContext, useState } from 'react';
import type { AdminTab } from '@/components/NavBar';

interface AdminTabContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

const AdminTabContext = createContext<AdminTabContextType>({
  activeTab: 'dashboard',
  setActiveTab: () => {},
});

export function AdminTabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  return (
    <AdminTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AdminTabContext.Provider>
  );
}

export function useAdminTab() {
  return useContext(AdminTabContext);
}
