'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';
import type { AdminTab } from '@/components/NavBar';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Admin tab state (derived from pathname for admin)
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Redirect to login if not authenticated, or to superadmin dashboard if Super Admin
  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/');
    }
    if (!loading && profile?.role === 'Super Admin') {
      router.push('/superadmin/dashboard');
    }
  }, [loading, firebaseUser, profile, router]);

  // Show loading while auth resolves
  if (loading || !firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Build user object from real data
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : firebaseUser?.displayName || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const user = {
    name: displayName,
    initials,
    role: profile?.role || 'Student',
  };

  const isAdmin = profile?.role === 'Administrator';
  const isFaculty = profile?.role === 'Faculty' || profile?.role === 'Faculty Professor';
  const isStudent = !isAdmin && !isFaculty && profile?.role !== 'Utility Staff' && profile?.role !== 'Utility';

  // Shared mobile bottom nav icons
  const navIcons = {
    home: <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />,
    reserve: <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />,
    history: <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />,
    contact: <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />,
  };

  // Student mobile bottom nav items
  const studentMobileNav = [
    { label: 'Home', href: '/dashboard', active: pathname === '/dashboard', icon: navIcons.home },
    { label: 'Reserve', href: '/dashboard/reserve', active: pathname === '/dashboard/reserve', icon: navIcons.reserve },
    { label: 'History', href: '/dashboard/reservations', active: pathname === '/dashboard/reservations', icon: navIcons.history },
    { label: 'Contact', href: '/dashboard/contact', active: pathname === '/dashboard/contact', icon: navIcons.contact },
  ];

  // Faculty mobile bottom nav items (same as student, no feedback)
  const facultyMobileNav = [
    { label: 'Home', href: '/dashboard', active: pathname === '/dashboard', icon: navIcons.home },
    { label: 'Reserve', href: '/dashboard/reserve', active: pathname === '/dashboard/reserve', icon: navIcons.reserve },
    { label: 'History', href: '/dashboard/reservations', active: pathname === '/dashboard/reservations', icon: navIcons.history },
    { label: 'Contact', href: '/dashboard/contact', active: pathname === '/dashboard/contact', icon: navIcons.contact },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Decorative background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-20 -left-40 w-96 h-96 rounded-full bg-secondary/8 blur-3xl" />
      </div>

      <NavBar
        user={user}
        onLogout={logout}
        {...(isAdmin ? { activeTab, onTabChange: setActiveTab } : {})}
      />

      {children}

      {/* Mobile Bottom Nav (Student only) */}
      {isStudent && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-white/10 z-40">
          <div className="grid grid-cols-4 h-16">
            {studentMobileNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center transition-colors ${
                  item.active ? 'text-primary' : 'text-white/30 hover:text-primary'
                }`}
              >
                <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">{item.icon}</svg>
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav (Faculty only) */}
      {isFaculty && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-white/10 z-40">
          <div className="grid grid-cols-4 h-16">
            {facultyMobileNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center transition-colors ${
                  item.active ? 'text-primary' : 'text-white/30 hover:text-primary'
                }`}
              >
                <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">{item.icon}</svg>
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
