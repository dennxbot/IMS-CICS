'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Calendar, Printer, Filter } from "lucide-react";
import { formatPhilippineDateDisplay } from "@/lib/timeUtils";
import { Timesheet } from "@/types/internship";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AttendanceHistoryClientProps {
    initialData: Timesheet[];
}

export function AttendanceHistoryClient({ initialData }: AttendanceHistoryClientProps) {
    const [filterType, setFilterType] = useState<'all' | 'month' | 'week'>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Helper to format time
    const formatTime = (timeStr: string | null | undefined) => {
        if (!timeStr) return 'N/A';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${displayH}:${minutes} ${period}`;
    };

    // Filter logic
    const filteredData = initialData.filter(record => {
        if (filterType === 'all') return true;

        const recordDate = new Date(record.date);
        const recordMonth = recordDate.toISOString().slice(0, 7);

        if (filterType === 'month') {
            return recordMonth === selectedMonth;
        }

        // Simple week filter (current week) - can be expanded
        if (filterType === 'week') {
            const now = new Date();
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
            return recordDate >= startOfWeek && recordDate <= endOfWeek;
        }

        return true;
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <Card className="print:hidden">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <Select value={filterType} onValueChange={(v: 'all' | 'month' | 'week') => setFilterType(v)}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Records</SelectItem>
                                <SelectItem value="month">By Month</SelectItem>
                                <SelectItem value="week">Current Week</SelectItem>
                            </SelectContent>
                        </Select>

                        {filterType === 'month' && (
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="border rounded px-2 py-1.5 text-sm"
                            />
                        )}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
                            <Printer className="mr-2 h-4 w-4" />
                            Print / Save PDF
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Printable Area */}
            <div className="print:p-8 print:bg-white">
                <div className="hidden print:block mb-6 text-center">
                    <h1 className="text-2xl font-bold">Daily Time Record</h1>
                    <p className="text-gray-600">Attendance Report</p>
                </div>

                <Card className="print:border-none print:shadow-none">
                    <CardHeader className="print:hidden">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Attendance Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="print:p-0">
                        {filteredData.length > 0 ? (
                            <div className="rounded-md border print:border-none print:rounded-none print:overflow-visible">
                                <Table className="print:w-full print:border-collapse print:border print:border-black">
                                    <TableHeader>
                                        <TableRow className="print:border-black">
                                            <TableHead className="print:text-black print:font-bold print:border print:border-black print:bg-gray-100 print:text-center print:h-10 print:px-2">Date</TableHead>
                                            <TableHead className="print:text-black print:font-bold print:border print:border-black print:bg-gray-100 print:text-center print:h-10 print:px-2">Session</TableHead>
                                            <TableHead className="print:text-black print:font-bold print:border print:border-black print:bg-gray-100 print:text-center print:h-10 print:px-2">Time In</TableHead>
                                            <TableHead className="print:text-black print:font-bold print:border print:border-black print:bg-gray-100 print:text-center print:h-10 print:px-2">Time Out</TableHead>
                                            <TableHead className="print:text-black print:font-bold print:border print:border-black print:bg-gray-100 print:text-center print:h-10 print:px-2">Duration</TableHead>
                                            <TableHead className="print:text-black print:font-bold print:border print:border-black print:bg-gray-100 print:text-center print:h-10 print:px-2">Status</TableHead>
                                            <TableHead className="print:text-black print:font-bold print:border print:border-black print:bg-gray-100 print:text-center print:h-10 print:px-2">Remarks</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredData.map((record) => (
                                            <TableRow key={record.id} className="print:border-black">
                                                <TableCell className="font-medium print:text-black print:border print:border-black print:text-center print:p-2">
                                                    {formatPhilippineDateDisplay(new Date(record.date))}
                                                </TableCell>
                                                <TableCell className="print:text-black print:border print:border-black print:text-center print:p-2">
                                                    <span className="print:hidden">
                                                        <Badge variant="outline">
                                                            {record.session === 1 ? 'Morning' : 'Afternoon'}
                                                        </Badge>
                                                    </span>
                                                    <span className="hidden print:inline">
                                                        {record.session === 1 ? 'Morning' : 'Afternoon'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="print:text-black print:border print:border-black print:text-center print:p-2">
                                                    <div className="flex items-center gap-1 text-green-600 print:text-black print:justify-center">
                                                        <Clock className="h-3 w-3 print:hidden" />
                                                        {formatTime(record.time_start)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="print:text-black print:border print:border-black print:text-center print:p-2">
                                                    {record.time_end ? (
                                                        <div className="flex items-center gap-1 text-red-600 print:text-black print:justify-center">
                                                            <Clock className="h-3 w-3 print:hidden" />
                                                            {formatTime(record.time_end)}
                                                        </div>
                                                    ) : (
                                                        <span className="print:text-black">Ongoing</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="print:text-black print:border print:border-black print:text-center print:p-2">
                                                    {record.total_hours > 0 ? `${record.total_hours} hrs` : '-'}
                                                </TableCell>
                                                <TableCell className="print:text-black print:border print:border-black print:text-center print:p-2">
                                                    <span className="print:hidden">
                                                        {record.is_verified ? (
                                                            <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Pending</Badge>
                                                        )}
                                                    </span>
                                                    <span className="hidden print:inline">
                                                        {record.is_verified ? 'Verified' : 'Pending'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate print:max-w-none print:text-black print:border print:border-black print:p-2 print:whitespace-normal" title={record.remarks || ''}>
                                                    {record.remarks || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No attendance records found for this period.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Print Footer */}
                <div className="hidden print:flex mt-12 justify-between px-8">
                    <div className="text-center">
                        <div className="border-t border-black w-48 pt-2">Student Signature</div>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-black w-48 pt-2">Supervisor Signature</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
