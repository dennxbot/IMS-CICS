import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/LogoutButton";
import { User, Mail, Phone, MapPin, GraduationCap, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function StudentProfile() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  if (user.user_type !== 2) {
    // Redirect to appropriate dashboard based on user type
    switch (user.user_type) {
      case 1:
        redirect('/admin/dashboard');
        break;
      case 3:
        redirect('/coordinator/dashboard');
        break;
      default:
        redirect('/login');
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/student/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profile_image_url || undefined} alt={user.full_name} />
                <AvatarFallback className="text-xl bg-blue-500 text-white">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-semibold">{user.full_name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <Badge variant="secondary" className="mt-2">
                  Student ID: {user.student_id || 'Not assigned'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Full Name:</span>
                  <span>{user.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                </div>
                {user.student_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Student ID:</span>
                    <span>{user.student_id}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {user.course && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Course:</span>
                    <span>{user.course}</span>
                  </div>
                )}
                {user.year_level && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Year Level:</span>
                    <span>{user.year_level}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.contact_number ? (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Phone:</span>
                <span>{user.contact_number}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No contact number provided
              </div>
            )}
            {user.address ? (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="font-medium">Address:</span>
                <span className="flex-1">{user.address}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No address provided
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge variant={user.is_active ? "default" : "destructive"}>
                {user.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">User Type:</span>
              <Badge variant="secondary">Student</Badge>
            </div>
            <div className="text-sm text-gray-500">
              Member since: {new Date(user.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link href="/student/dashboard">
          <Button>
            Back to Dashboard
          </Button>
        </Link>
        {/* You can add edit functionality later */}
        {/* <Button variant="outline">
          Edit Profile
        </Button> */}
      </div>
    </div>
  );
}