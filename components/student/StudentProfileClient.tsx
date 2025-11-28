'use client';

import { useState } from 'react';
import { User } from '@/types/internship';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Mail, Phone, GraduationCap,
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
                <div className="h-48 md:h-64 w-full bg-primary/10 rounded-b-3xl border-b relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

                    {/* Back Button (Absolute) */}
                    <Link href="/student/dashboard" className="absolute top-6 left-6 z-10">
                        <Button variant="default" size="sm" className="shadow-sm">
                            <ArrowLeft className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Dashboard</span>
                        </Button>
                    </Link>
                </div>

                {/* Profile Card Overlay */}
                <div className="absolute -bottom-16 left-0 right-0 px-6 flex justify-center md:justify-start md:px-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 w-full max-w-5xl">
                        <div className="relative">
                            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl">
                                <AvatarImage src={user.profile_image_url || undefined} alt={user.full_name} />
                                <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                                    {getInitials(user.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-2 border-background ${user.is_active ? 'bg-green-500' : 'bg-destructive'}`} />
                        </div>

                        <div className="flex-1 text-center md:text-left mb-2 md:mb-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{user.full_name}</h1>
                            <p className="text-muted-foreground font-medium">{user.course || 'Student'}</p>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                <Badge variant="outline" className="px-3 py-1">
                                    {user.student_id || 'No ID'}
                                </Badge>
                                <Badge>
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
                    <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-8 bg-muted/50 p-1">
                        <TabsTrigger
                            value="overview"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="details"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            Full Details
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Quick Info Cards */}
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contact</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-xs text-muted-foreground">Email</p>
                                                    <p className="text-sm font-medium truncate" title={user.email}>{user.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => copyToClipboard(user.email, 'Email')}
                                            >
                                                {copiedField === 'Email' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Phone</p>
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
                                                    {copiedField === 'Phone' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Academic</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                                <GraduationCap className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Course</p>
                                                <p className="text-sm font-medium line-clamp-2" title={user.course || ''}>{user.course || 'N/A'}</p>
                                            </div>
                                        </div>


                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow md:col-span-1">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Internship</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                                <Building className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Company</p>
                                                <p className="text-sm font-medium">Assigned Company</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Status</p>
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
                                        <h3 className="font-semibold text-foreground border-b pb-2">Personal Details</h3>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <span className="text-muted-foreground">Full Name</span>
                                            <span className="col-span-2 font-medium">{user.full_name}</span>

                                            <span className="text-muted-foreground">Address</span>
                                            <span className="col-span-2 font-medium">{user.address || 'N/A'}</span>

                                            <span className="text-muted-foreground">Phone</span>
                                            <span className="col-span-2 font-medium">{user.contact_number || 'N/A'}</span>

                                            <span className="text-muted-foreground">Email</span>
                                            <span className="col-span-2 font-medium">{user.email}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-foreground border-b pb-2">Academic Information</h3>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <span className="text-muted-foreground">Student ID</span>
                                            <span className="col-span-2 font-medium">{user.student_id || 'N/A'}</span>

                                            <span className="text-muted-foreground">Course</span>
                                            <span className="col-span-2 font-medium">{user.course || 'N/A'}</span>


                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
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
