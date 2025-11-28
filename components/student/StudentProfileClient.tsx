'use client';

import { User } from '@/types/internship';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Camera, MapPin, Key, ArrowLeft } from "lucide-react";
import { CalendarIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons";
import Link from "next/link";

interface StudentProfileClientProps {
    user: User;
}

export function StudentProfileClient({ user }: StudentProfileClientProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const fullName = user.full_name || '';
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    return (
        <div className="container mx-auto space-y-6 px-4 py-10 max-w-5xl">
            {/* Back Button */}
            <div className="mb-4">
                <Link href="/student/dashboard">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            {/* Profile Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center gap-6 md:flex-row md:items-start md:text-left md:items-center">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user.profile_image_url || undefined} alt={user.full_name} />
                                <AvatarFallback className="text-2xl">{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>
                            {/* Camera Icon - maybe for upload later */}
                            <Button
                                size="icon"
                                variant="outline"
                                className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full"
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <h1 className="text-2xl font-bold">{user.full_name}</h1>
                                <Badge variant="secondary">Intern</Badge>
                                {user.is_active && <Badge variant="default">Active</Badge>}
                            </div>
                            <p className="text-muted-foreground">{user.course || 'Student'}</p>
                            <div className="text-muted-foreground flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <EnvelopeClosedIcon className="size-4" />
                                    {user.email}
                                </div>
                                {user.address && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="size-4" />
                                        {user.address}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <CalendarIcon className="size-4" />
                                    Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Content */}
            <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 h-auto md:grid-cols-4 md:h-10">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        Security
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Coming Soon</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        Notifications
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Coming Soon</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* Personal Information */}
                <TabsContent value="personal" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Your personal details and profile information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" defaultValue={firstName} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" defaultValue={lastName} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue={user.email} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" defaultValue={user.contact_number || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="course">Course</Label>
                                    <Input id="course" defaultValue={user.course || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="studentId">Student ID</Label>
                                    <Input id="studentId" defaultValue={user.student_id || ''} readOnly />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    defaultValue={user.address || ''}
                                    rows={2}
                                    readOnly
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Account Settings */}
                <TabsContent value="account" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Status</CardTitle>
                            <CardDescription>Manage your account status.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-base">Account Status</Label>
                                    <p className="text-muted-foreground text-sm">Your account is currently {user.is_active ? 'active' : 'inactive'}</p>
                                </div>
                                <Badge variant={user.is_active ? "default" : "destructive"}>
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-base">Internship Program</Label>
                                    <p className="text-muted-foreground text-sm">Standard Internship Track</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Settings - Static Placeholder */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Manage your account security.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base">Password</Label>
                                        <p className="text-muted-foreground text-sm">Managed by Administrator</p>
                                    </div>
                                    <Button variant="outline" disabled>
                                        <Key className="mr-2 h-4 w-4" />
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notification Settings - Static Placeholder */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Choose what notifications you want to receive.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base">Email Notifications</Label>
                                        <p className="text-muted-foreground text-sm">Receive notifications via email</p>
                                    </div>
                                    <Switch defaultChecked disabled />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
