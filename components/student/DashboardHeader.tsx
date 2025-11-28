'use client';

import { User } from '@/types/internship';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/LogoutButton";
import { Menu } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
    user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    return (
        <div className="flex flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600">Welcome back, {user.full_name}</p>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-wrap gap-2">
                <Link href="/student/profile">
                    <Button variant="outline" size="sm" className="h-10 text-sm">Profile</Button>
                </Link>
                <Link href="/student/attendance">
                    <Button variant="outline" size="sm" className="h-10 text-sm">My Attendance</Button>
                </Link>
                <Link href="/student/reports">
                    <Button variant="outline" size="sm" className="h-10 text-sm">My Reports</Button>
                </Link>
                <LogoutButton />
            </div>

            {/* Mobile Navigation (Burger Menu) */}
            <div className="md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild>
                            <Link href="/student/profile" className="w-full cursor-pointer">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/student/attendance" className="w-full cursor-pointer">My Attendance</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/student/reports" className="w-full cursor-pointer">My Reports</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="p-1">
                            <LogoutButton variant="ghost" className="w-full justify-start h-8 px-2" />
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
