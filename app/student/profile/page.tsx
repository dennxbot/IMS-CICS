import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { StudentProfileClient } from "@/components/student/StudentProfileClient";

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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <StudentProfileClient user={user} />
    </div>
  );
}