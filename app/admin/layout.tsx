'use client';

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Building,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

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
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (sidebarOpen && !target.closest('.sidebar') && !target.closest('.sidebar-toggle')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

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
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
      )}

      {/* Sidebar */}
      <div className={`
        sidebar fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
            <p className="text-sm text-gray-600 mt-1">{user.full_name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden sidebar-toggle"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="mt-6">
          <Link
            href="/admin/dashboard"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          
          <Link
            href="/admin/students"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Users className="w-5 h-5 mr-3" />
            Students
          </Link>
          
          <Link
            href="/admin/companies"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Building className="w-5 h-5 mr-3" />
            Companies
          </Link>
          
          <Link
            href="/admin/courses"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <GraduationCap className="w-5 h-5 mr-3" />
            Courses
          </Link>
          
          <Link
            href="/admin/attendance"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Calendar className="w-5 h-5 mr-3" />
            Attendance
          </Link>
          
          <Link
            href="/admin/reports"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <FileText className="w-5 h-5 mr-3" />
            Reports
          </Link>
          
          <Link
            href="/admin/settings"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Link>
          
          <div className="border-t mt-6 pt-6">
            <form action="/logout" method="post">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:text-gray-900"
                type="submit"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </form>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="sidebar-toggle"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="ml-4 text-lg font-semibold text-gray-800">Admin Panel</h1>
          </div>
          
          {/* Profile Dropdown for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-5 h-5" />
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/logout" method="post" className="w-full">
                  <button type="submit" className="flex items-center w-full text-left cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}