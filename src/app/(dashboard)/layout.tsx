// src/app/(dashboard)/layout.tsx
import { SidebarNav } from '@/components/sidebar-nav';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar';
import { AuthProvider } from '@/hooks/use-auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarNav />
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <div className="p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}