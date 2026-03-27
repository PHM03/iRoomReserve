'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { normalizeRole, USER_ROLES } from '@/lib/domain/roles';

// ─── Admin Tab Type ──────────────────────────────────────────────
export type AdminTab = 'dashboard' | 'add-rooms' | 'feedback' | 'status-scheduling' | 'room-history' | 'inbox' | 'pending';

interface NavBarProps {
  user: {
    name: string;
    initials: string;
    role: string;
  };
  onLogout?: () => void;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

const NavBar: React.FC<NavBarProps> = ({ user, onLogout, activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    router.push('/');
  };

  const getRoleBadgeStyle = () => {
    switch (normalizeRole(user.role)) {
      case USER_ROLES.STUDENT:
        return 'bg-blue-100/90 text-blue-800 border-blue-300/80';
      case USER_ROLES.FACULTY:
        return 'bg-green-100/90 text-green-800 border-green-300/80';
      case USER_ROLES.UTILITY:
        return 'bg-teal-100/90 text-teal-800 border-teal-300/80';
      case USER_ROLES.ADMIN:
        return 'bg-red-100/90 text-red-800 border-red-300/80';
      case USER_ROLES.SUPER_ADMIN:
        return 'bg-purple-100/90 text-purple-800 border-purple-300/80';
      default:
        return 'bg-dark/10 text-black border-dark/20';
    }
  };

  // ─── Admin-specific nav links ─────────────────────────────────
  const adminLinks: { label: string; tab: AdminTab; icon: React.ReactNode }[] = [
    {
      label: 'Dashboard',
      tab: 'dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      label: 'Pending',
      tab: 'pending',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Add Rooms',
      tab: 'add-rooms',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      label: 'Feedback',
      tab: 'feedback',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
    },
    {
      label: 'Status & Scheduling',
      tab: 'status-scheduling',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Room History',
      tab: 'room-history',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: 'Inbox',
      tab: 'inbox',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  // ─── Non-admin (Student/Faculty/Utility) nav links ────────────
  const normalizedRole = normalizeRole(user.role);
  const isFacultyRole = normalizedRole === USER_ROLES.FACULTY;
  const isUtilityRole = normalizedRole === USER_ROLES.UTILITY;

  const defaultLinks = isUtilityRole
    ? [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Room Status', href: '/dashboard/room-status' },
        { label: 'Inbox', href: '/dashboard/inbox' },
        { label: 'Contact', href: '/dashboard/contact' },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Reserve', href: '/dashboard/reserve' },
        { label: 'My Reservations', href: '/dashboard/reservations' },
        { label: 'Inbox', href: '/dashboard/inbox' },
        { label: 'Contact', href: '/dashboard/contact' },
        ...(!isFacultyRole ? [{ label: 'Feedback', href: '/dashboard/feedback' }] : []),
      ];

  const isAdmin = normalizedRole === USER_ROLES.ADMIN;
  const navItemBaseClasses =
    'rounded-lg text-sm font-bold transition-all duration-200 ease-in-out';
  const navItemActiveClasses =
    'bg-[#a12124]/12 text-[#a12124] shadow-[inset_0_0_0_1px_rgba(161,33,36,0.14)]';
  const navItemInactiveClasses =
    'text-[#343434] hover:bg-[#a12124]/8 hover:text-[#a12124] hover:shadow-[inset_0_0_0_1px_rgba(161,33,36,0.08)]';
  const getNavItemClasses = (isActive: boolean) =>
    `${navItemBaseClasses} ${isActive ? navItemActiveClasses : navItemInactiveClasses}`;
  const navIconButtonClasses =
    'rounded-lg p-2 text-[#343434] transition-all duration-200 ease-in-out hover:bg-[#a12124]/8 hover:text-[#a12124]';

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-[#343434]">iRoomReserve</h1>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {isAdmin ? (
              adminLinks.map((link) => (
                <button
                  key={link.tab}
                  onClick={() => onTabChange?.(link.tab)}
                  className={`flex items-center gap-1.5 px-3 py-2 ${getNavItemClasses(
                    activeTab === link.tab
                  )}`}
                >
                  {link.icon}
                  {link.label}
                </button>
              ))
            ) : (
              defaultLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 ${getNavItemClasses(pathname === link.href)}`}
                >
                  {link.label}
                </Link>
              ))
            )}
          </div>

          {/* Right: User Info & Logout */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold">
                {user.initials}
              </div>
              <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeStyle()}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className={navIconButtonClasses}
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden ${navIconButtonClasses}`}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[#343434]/8 bg-[#f5f5f5]/80 backdrop-blur-xl">
          <div className="px-3 py-2 space-y-1">
            {isAdmin ? (
              adminLinks.map((link) => (
                <button
                  key={link.tab}
                  onClick={() => {
                    onTabChange?.(link.tab);
                    setIsMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left ${getNavItemClasses(
                    activeTab === link.tab
                  )}`}
                >
                  {link.icon}
                  {link.label}
                </button>
              ))
            ) : (
              defaultLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2.5 ${getNavItemClasses(pathname === link.href)}`}
                >
                  {link.label}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
