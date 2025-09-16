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
import { useSupabase, useAuth } from '@/components/providers';
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

// ✅ FIXED: Define proper TypeScript interfaces
interface NavItemBase {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavItemWithSub extends NavItemBase {
  subItems: NavItemBase[];
}

type NavItem = NavItemBase | NavItemWithSub;

interface NavGroup {
  title: string;
  items: NavItem[];
}

// ✅ FIXED: Properly typed navigation array
const navigation: NavGroup[] = [
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
            icon: User,
          },
          {
            title: 'Permissions',
            href: '/settings#permissions',
            icon: Shield,
          },
          {
            title: 'Billing',
            href: '/settings#billing',
            icon: HardDrive,
          },
        ],
      },
    ],
  },
];

// ✅ FIXED: Type guard function
function isNavItemWithSub(item: NavItem): item is NavItemWithSub {
  return 'subItems' in item;
}

export function SidebarNav() {
  const pathname = usePathname();
  const supabase = useSupabase();
  const { user, loading } = useAuth(); // Use useAuth hook
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout API fails
      window.location.href = '/login';
    }
  };

  if (loading || !user) {
    return null; // Don't render sidebar if not authenticated
  }

  return (
    <>
      <SidebarHeader>
        <h2 className="text-lg font-semibold">DataVue</h2>
        <p className="text-sm text-muted-foreground">Visual Historian</p>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  
                  // ✅ FIXED: Use type guard to check for subItems
                  if (isNavItemWithSub(item)) {
                    return (
                      <Collapsible
                        key={item.title}
                        open={openGroups[item.title]}
                        onOpenChange={() => toggleGroup(item.title)}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto h-4 w-4" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {/* ✅ FIXED: Properly typed subItem parameter */}
                              {item.subItems.map((subItem: NavItemBase) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <Link href={subItem.href}>
                                      <subItem.icon className="h-4 w-4" />
                                      <span>{subItem.title}</span>
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

                  // Regular navigation item without subItems
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center space-x-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.email} />
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground truncate">Admin</p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}