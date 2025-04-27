import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Users, Settings, Database, Box, Activity, Brain, ToolIcon } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  const navigationItems = [
    { href: '/dashboard', label: 'Overview', icon: Home },
    { href: '/dashboard/modules', label: 'Modules', icon: Box },
    { href: '/dashboard/tools', label: 'Tools Browser', icon: ToolIcon },
    { href: '/dashboard/knowledge-base', label: 'Knowledge Base', icon: Brain },
    { href: '/dashboard/users', label: 'Users', icon: Users },
    { href: '/dashboard/activity', label: 'Activity', icon: Activity },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-semibold">Control Center</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigationItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-lg p-3 text-sm font-medium ${
                  isActive(item.href)
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
