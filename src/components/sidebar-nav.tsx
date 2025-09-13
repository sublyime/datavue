
'use client';

import {
  DatabaseZap,
  LayoutDashboard,
  Replace,
  Rss,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/data-sources',
    label: 'Data Sources',
    icon: Rss,
  },
  {
    href: '/storage',
    label: 'Storage',
    icon: DatabaseZap,
  },
  {
    href: '/protocol-translator',
    label: 'Protocol Translator',
    icon: Replace,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <>
      <SidebarHeader>
        <div className="flex w-full items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Wrench className="size-6 text-primary" />
            <span className="text-lg text-sidebar-foreground">DataVue</span>
          </Link>
          {isMobile && <SidebarTrigger />}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
