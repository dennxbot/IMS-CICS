'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Download, Users, Shield, ShieldAlert, ShieldCheck, MapPin, ExternalLink } from 'lucide-react';

import {
  calculateSessionHours,
  getSessionStatus,
  formatTime
} from '@/lib/attendanceUtils';

interface Company {
  id: number;
  name: string;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  course: string;
  timesheets: { count: number }[];
}

interface AttendanceRecord {
  id: number;
  date: string;
  session: number;
  time_start: string | null;
  time_end: string | null;
  is_verified: boolean;
  total_hours: number;
  remarks: string | null;
  morning_check_in: string | null;
  morning_check_out: string | null;
  afternoon_check_in: string | null;
  afternoon_check_out: string | null;
  total_morning_hours: number;
  total_afternoon_hours: number;
  morning_late_minutes: number;
  afternoon_late_minutes: number;
  check_in_method: string;
  location_verified: boolean;
  location_latitude: number | null;
  location_longitude: number | null;
  anti_spoofing_score: number | null;
  users: {
    full_name: string;
    student_id: string;
    course: string;
    company_id: number;
  };
}

export default function AdminAttendancePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  // Fetch attendance data
  const fetchAttendance = async () => {
    if (!selectedCompany) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        company_id: selectedCompany,
      });

      if (dateRange.from) {
        params.append('start_date', dateRange.from);
      }
      if (dateRange.to) {
        params.append('end_date', dateRange.to);
      }

      const response = await fetch(`/api/admin/attendance?${params}`);
      const data = await response.json();
      if (data.attendance) {
        setAttendance(data.attendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch students and attendance when company is selected
  useEffect(() => {
    console.log('Company selection changed:', selectedCompany);
    if (selectedCompany) {
      console.log('Fetching data for company:', selectedCompany);
      fetchStudentsByCompany(selectedCompany);
      fetchAttendance();
    } else {
      console.log('No company selected, clearing data');
      setStudents([]);
      setAttendance([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, dateRange]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      const data = await response.json();
      if (data.companies) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchStudentsByCompany = async (companyId: string) => {
    try {
      setLoading(true);
      console.log('Fetching students for company:', companyId);
      const response = await fetch(`/api/admin/attendance/companies/${companyId}`);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Students data received:', data);

      if (data.students) {
        setStudents(data.students);
      } else {
        console.warn('No students field in response:', data);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const exportAttendance = async (format: 'csv' | 'json') => {
    if (!selectedCompany) return;

    try {
      const params = new URLSearchParams({
        company_id: selectedCompany,
        format,
      });

      if (dateRange.from) {
        params.append('start_date', dateRange.from);
      }
      if (dateRange.to) {
        params.append('end_date', dateRange.to);
      }

      const response = await fetch(`/api/admin/attendance/export?${params}`);

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${selectedCompany}_${dateRange.from}_${dateRange.to}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${selectedCompany}_${dateRange.from}_${dateRange.to}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting attendance:', error);
    }
  };



  const getSessionBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'absent':
        return <Badge className="bg-gray-100 text-gray-800">No Data</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Incomplete</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">
            Manage student attendance by company and date range
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Select a company and date range to view attendance records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Select value={selectedCompany} onValueChange={(value) => {
                console.log('Company selected:', value);
                setSelectedCompany(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button
                  onClick={() => exportAttendance('csv')}
                  disabled={!selectedCompany || loading}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => exportAttendance('json')}
                  disabled={!selectedCompany || loading}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Summary */}
      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Students ({students.length})
            </CardTitle>
            <CardDescription>
              Students assigned to selected company
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading students...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <Card key={student.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{student.full_name}</h4>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={Math.min((student.timesheets?.[0]?.count || 0), 100)}
                            max={100}
                            color="primary"
                            className="w-16 h-1"
                          />
                          <span className="text-xs text-muted-foreground">
                            {student.timesheets?.[0]?.count || 0}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{student.student_id}</p>
                      <p className="text-sm text-muted-foreground">{student.course}</p>
                      <Badge variant="outline">
                        {student.timesheets?.[0]?.count || 0} attendance records
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance Records */}
      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Detailed attendance records for the selected date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading attendance records...</div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No attendance records found for the selected criteria
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Morning Session</TableHead>
                      <TableHead>Afternoon Session</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => {
                      const morningStatus = getSessionStatus(record.morning_check_in, record.morning_check_out);
                      const afternoonStatus = getSessionStatus(record.afternoon_check_in, record.afternoon_check_out);
                      const morningHours = calculateSessionHours(record.morning_check_in, record.morning_check_out);
                      const afternoonHours = calculateSessionHours(record.afternoon_check_in, record.afternoon_check_out);

                      // Determine Trust Score visuals
                      const score = record.anti_spoofing_score || 100;
                      let TrustIcon = ShieldCheck;
                      let trustColor = "text-green-600";
                      let trustBg = "bg-green-50";

                      if (score < 80) {
                        TrustIcon = ShieldAlert;
                        trustColor = "text-red-600";
                        trustBg = "bg-red-50";
                      } else if (score < 95) {
                        TrustIcon = Shield;
                        trustColor = "text-yellow-600";
                        trustBg = "bg-yellow-50";
                      }

                      return (
                        <TableRow key={record.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium">{format(new Date(record.date), 'MMM dd')}</div>
                            <div className="text-xs text-muted-foreground">{format(new Date(record.date), 'yyyy')}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{record.users.full_name}</div>
                            <div className="text-xs text-muted-foreground">{record.users.student_id}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {getSessionBadge(morningStatus)}
                              </div>
                              {record.morning_check_in && (
                                <div className="text-xs text-gray-500">
                                  {formatTime(record.morning_check_in)} - {formatTime(record.morning_check_out)}
                                </div>
                              )}
                              {record.morning_late_minutes > 0 && (
                                <div className="text-xs text-red-500 font-medium">
                                  +{record.morning_late_minutes}m late
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {getSessionBadge(afternoonStatus)}
                              </div>
                              {record.afternoon_check_in && (
                                <div className="text-xs text-gray-500">
                                  {formatTime(record.afternoon_check_in)} - {formatTime(record.afternoon_check_out)}
                                </div>
                              )}
                              {record.afternoon_late_minutes > 0 && (
                                <div className="text-xs text-red-500 font-medium">
                                  +{record.afternoon_late_minutes}m late
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold">
                              {(morningHours + afternoonHours).toFixed(1)}h
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-md w-fit ${trustBg}`}>
                              <TrustIcon className={`h-4 w-4 ${trustColor}`} />
                              <span className={`text-xs font-medium ${trustColor}`}>
                                {score}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">
                                {record.check_in_method || 'manual'}
                              </Badge>
                              {record.location_latitude && record.location_longitude ? (
                                <a
                                  href={`https://www.google.com/maps?q=${record.location_latitude},${record.location_longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                                >
                                  <MapPin className="h-3 w-3" />
                                  View Map
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  No Loc
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate" title={record.remarks || ''}>
                            {record.remarks || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}