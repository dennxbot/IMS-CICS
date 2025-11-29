'use client';

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { SystemSettings } from "@/types/internship";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/ui/NotificationBell";

interface User {
  id: string;
  email: string;
  user_type: number;
  full_name: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
          console.log('No authenticated user found, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Authenticated user found:', data.user.id);

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_type, full_name')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          router.push('/login');
          return;
        }

        if (!userData) {
          console.log('No user data found in users table');
          router.push('/login');
          return;
        }

        console.log('User data fetched:', userData);

        if (userData.user_type !== 1) {
          // Redirect to appropriate dashboard for non-admin users
          console.log('User is not admin, redirecting to appropriate dashboard');
          switch (userData.user_type) {
            case 2:
              router.push('/student/dashboard');
              break;
            default:
              router.push('/login');
          }
          return;
        }

        console.log('Admin user authenticated successfully');
        setUser({
          ...data.user,
          user_type: userData.user_type,
          email: data.user.email || '', // ensure email is always a string
          full_name: userData.full_name,
        });

        // Fetch system settings
        try {
          const settingsResponse = await fetch('/api/admin/system-settings');
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            setSystemSettings(settingsData.settings);
          }
        } catch (settingsError) {
          console.warn('Failed to fetch system settings:', settingsError);
        }
      } catch (error) {
        console.error('Error in fetchUser:', error);
        setAuthError(error instanceof Error ? error.message : 'Authentication failed. Please try logging in again.');
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const getPageTitle = (path: string) => {
    if (path.includes('/admin/dashboard')) return 'Dashboard';
    if (path.includes('/admin/students')) return 'Students';
    if (path.includes('/admin/companies')) return 'Companies';
    if (path.includes('/admin/courses')) return 'Courses';
    if (path.includes('/admin/attendance')) return 'Attendance';
    if (path.includes('/admin/reports')) return 'Reports';
    if (path.includes('/admin/settings')) return 'Settings';
    return 'Admin Panel';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-700 mb-6">{authError}</p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} systemSettings={systemSettings} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 pr-4">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="font-semibold">{getPageTitle(pathname)}</span>
          </div>
          <NotificationBell />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}