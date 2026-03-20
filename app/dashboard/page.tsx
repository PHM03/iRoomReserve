'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import type { AdminTab } from '@/components/NavBar';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import FacultyDashboard from '@/components/dashboards/FacultyDashboard';
import UtilityStaffDashboard from '@/components/dashboards/UtilityStaffDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  const firstName = profile?.firstName || 'User';

  // Admin tab state — only needed for AdminDashboard
  const [activeTab, setActiveTab] = React.useState<AdminTab>('dashboard');

  // Render the role-specific dashboard
  switch (profile?.role) {
    case 'Faculty':
    case 'Faculty Professor':
      return <FacultyDashboard firstName={firstName} />;
    case 'Utility Staff':
    case 'Utility':
      return <UtilityStaffDashboard firstName={firstName} />;
    case 'Administrator':
      return <AdminDashboard firstName={firstName} activeTab={activeTab} />;
    case 'Student':
    default:
      return <StudentDashboard firstName={firstName} />;
  }
}
