// src/components/sidebar-nav.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Database,
  Settings,
  HardDrive,
  Zap,
  LogOut,
  User,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navigation = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Data Management',
    items: [
      {
        title: 'Data Sources',
        href: '/data-sources',
        icon: Database,
      },
      {
        title: 'Storage',
        href: '/storage',
        icon: HardDrive,
      },
      {
        title: 'Protocol Translator',
        href: '/protocol-translator',
        icon: Zap,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        subItems: [
          {
            title: 'Users',
            href: '/settings#users',
          },
          {
            title: 'Permissions',
            href: '/settings#permissions',
          },
          {
            title: 'Billing',
            href: '/settings#billing',
          },
        ],
      },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout API fails
      window.location.href = '/login';
    }
  };

  if (!user) {
    return null; // Don't render sidebar if not authenticated
  }

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">DataVue</span>
            <span className="text-xs text-sidebar-foreground/70">Visual Historian</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const hasSubItems = item.subItems && item.subItems.length > 0;

                  if (hasSubItems) {
                    return (
                      <Collapsible
                        key={item.title}
                        open={openGroups[item.title]}
                        onOpenChange={() => toggleGroup(item.title)}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className={cn(isActive && "bg-sidebar-accent")}>
                              <item.icon className="h-4 w-4" />
                              {item.title}
                              <ChevronRight className={cn(
                                "ml-auto h-4 w-4 transition-transform",
                                openGroups[item.title] && "rotate-90"
                              )} />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subItems?.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <Link href={subItem.href}>
                                      {subItem.title}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className={cn(isActive && "bg-sidebar-accent")}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                <AvatarFallback>
                  {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-sm font-medium truncate">{user.name}</span>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-sidebar-foreground/70" />
                  <span className="text-xs text-sidebar-foreground/70">{user.role}</span>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
              Logout
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}