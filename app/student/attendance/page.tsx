import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getStudentAttendanceHistory } from "@/lib/student";
// Client component for attendance history with print functionality
import { AttendanceHistoryClient } from "@/components/student/AttendanceHistoryClient";

export default async function StudentAttendancePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (user.user_type !== 2) {
        redirect('/login');
    }

    const attendanceHistory = await getStudentAttendanceHistory(user.id);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2 print:hidden">
                <div className="flex items-center gap-2 mb-2">
                    <Link href="/student/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
                </div>
                <p className="text-gray-600 ml-8">View and download your past attendance records.</p>
            </div>

            <AttendanceHistoryClient initialData={attendanceHistory} />
        </div>
    );
}
