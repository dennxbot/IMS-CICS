import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStudentAttendanceHistory } from "@/lib/student";
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
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
                <p className="text-gray-600">View and download your past attendance records.</p>
            </div>

            <AttendanceHistoryClient initialData={attendanceHistory} />
        </div>
    );
}
