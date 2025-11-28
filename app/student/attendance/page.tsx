import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStudentAttendanceHistory } from "@/lib/student";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhilippineDateDisplay } from "@/lib/timeUtils";
import { Clock, Calendar } from "lucide-react";

export default async function StudentAttendancePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (user.user_type !== 2) {
        redirect('/login');
    }

    const attendanceHistory = await getStudentAttendanceHistory(user.id);

    // Helper to format time
    const formatTime = (timeStr: string | null | undefined) => {
        if (!timeStr) return 'N/A';
        // Time is stored as HH:MM:SS
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${displayH}:${minutes} ${period}`;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
                <p className="text-gray-600">View your past attendance records and session details.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Attendance Records
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {attendanceHistory.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Session</TableHead>
                                        <TableHead>Time In</TableHead>
                                        <TableHead>Time Out</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceHistory.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">
                                                {formatPhilippineDateDisplay(new Date(record.date))}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {record.session === 1 ? 'Morning' : 'Afternoon'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTime(record.time_start)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {record.time_end ? (
                                                    <div className="flex items-center gap-1 text-red-600">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTime(record.time_end)}
                                                    </div>
                                                ) : (
                                                    <Badge variant="secondary">Ongoing</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {record.total_hours > 0 ? `${record.total_hours} hrs` : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {record.is_verified ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Pending</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={record.remarks || ''}>
                                                {record.remarks || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No attendance records found.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
