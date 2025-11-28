'use client';

import { useState } from 'react';
import { User } from '@/types/internship';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Mail, Phone, GraduationCap, Calendar,
    ArrowLeft, Copy, Check, Building, Clock
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
interface StudentProfileClientProps {
    user: User;
}

export function StudentProfileClient({ user }: StudentProfileClientProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(`${field} copied to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            {/* Cover Image & Profile Header */}
            <div className="relative mb-20">
                <div className="h-48 md:h-64 w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-b-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

                    {/* Back Button (Absolute) */}
                    <Link href="/student/dashboard" className="absolute top-6 left-6 z-10">
                        <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Profile Card Overlay */}
                <div className="absolute -bottom-16 left-0 right-0 px-6 flex justify-center md:justify-start md:px-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 w-full max-w-5xl">
                        <div className="relative">
                            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-xl">
                                <AvatarImage src={user.profile_image_url || undefined} alt={user.full_name} />
                                <AvatarFallback className="text-3xl bg-slate-100 text-slate-600">
                                    {getInitials(user.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-2 border-white ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>

                        <div className="flex-1 text-center md:text-left mb-2 md:mb-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{user.full_name}</h1>
                            <p className="text-gray-600 font-medium">{user.course || 'Student'}</p>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                <Badge variant="secondary" className="px-3 py-1">
                                    {user.student_id || 'No ID'}
                                </Badge>
                                <Badge className="bg-blue-600 hover:bg-blue-700">
                                    Intern
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 md:px-10 mt-24 md:mt-16">
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-8">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="details">Full Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Quick Info Cards */}
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Contact</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-xs text-gray-500">Email</p>
                                                    <p className="text-sm font-medium truncate" title={user.email}>{user.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => copyToClipboard(user.email, 'Email')}
                                            >
                                                {copiedField === 'Email' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-50 rounded-full text-green-600">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Phone</p>
                                                    <p className="text-sm font-medium">{user.contact_number || 'N/A'}</p>
                                                </div>
                                            </div>
                                            {user.contact_number && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => copyToClipboard(user.contact_number!, 'Phone')}
                                                >
                                                    {copiedField === 'Phone' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-400" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Academic</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-50 rounded-full text-purple-600">
                                                <GraduationCap className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Course</p>
                                                <p className="text-sm font-medium line-clamp-2" title={user.course || ''}>{user.course || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-50 rounded-full text-orange-600">
                                                <Calendar className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Year Level</p>
                                                <p className="text-sm font-medium">{user.year_level || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow md:col-span-1">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Internship</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-full text-indigo-600">
                                                <Building className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Company</p>
                                                <p className="text-sm font-medium">Assigned Company</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-pink-50 rounded-full text-pink-600">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Status</p>
                                                <Badge variant="outline" className="mt-0.5 text-xs font-normal">
                                                    Active
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="details">
                        <Card>
                            <CardHeader>
                                <CardTitle>Full Profile Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 border-b pb-2">Personal Details</h3>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <span className="text-gray-500">Full Name</span>
                                            <span className="col-span-2 font-medium">{user.full_name}</span>

                                            <span className="text-gray-500">Address</span>
                                            <span className="col-span-2 font-medium">{user.address || 'N/A'}</span>

                                            <span className="text-gray-500">Phone</span>
                                            <span className="col-span-2 font-medium">{user.contact_number || 'N/A'}</span>

                                            <span className="text-gray-500">Email</span>
                                            <span className="col-span-2 font-medium">{user.email}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 border-b pb-2">Academic Information</h3>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <span className="text-gray-500">Student ID</span>
                                            <span className="col-span-2 font-medium">{user.student_id || 'N/A'}</span>

                                            <span className="text-gray-500">Course</span>
                                            <span className="col-span-2 font-medium">{user.course || 'N/A'}</span>

                                            <span className="text-gray-500">Year Level</span>
                                            <span className="col-span-2 font-medium">{user.year_level || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>Account Created</span>
                                        <span>{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
