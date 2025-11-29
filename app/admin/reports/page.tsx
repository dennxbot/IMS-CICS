"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Eye,
  Filter,
  Users,
  FileText,
  Calendar,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportFilters {
  companyId?: string;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  course: string;
  companies: { name: string } | { name: string }[] | null;
}

interface RecentReport {
  id: number;
  student_id: string;
  week_starting: string;
  week_ending: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  total_hours_worked: number;
  users: {
    full_name: string;
    student_id: string;
  };
}

interface Company {
  id: number;
  name: string;
}

export default function AdminReportsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [activeTab, setActiveTab] = useState('students');
  const [filters, setFilters] = useState<ReportFilters>({
    companyId: 'all'
  });
  const [missingReports, setMissingReports] = useState<Student[]>([]);
  const [currentWeekRange, setCurrentWeekRange] = useState<{ start: string; end: string } | null>(null);

  // Handle filter changes
  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));

    if (key === 'companyId') {
      if (value !== 'all') {
        fetchStudentsByCompany(value);
        fetchRecentReports(value);
        fetchMissingReports(value);
      } else {
        setStudents([]);
        setRecentReports([]);
        setMissingReports([]);
      }
    }
  };

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      } else {
        console.error('Failed to fetch companies, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  // Fetch students by company
  const fetchStudentsByCompany = async (companyId: string) => {
    if (!companyId || companyId === 'all') {
      setStudents([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/students/by-company/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Fetch recent reports by company
  const fetchRecentReports = async (companyId: string) => {
    if (!companyId || companyId === 'all') {
      setRecentReports([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports/recent?companyId=${companyId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setRecentReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    }
  };

  // Fetch missing reports
  const fetchMissingReports = async (companyId: string) => {
    if (!companyId || companyId === 'all') {
      setMissingReports([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports/missing?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setMissingReports(data.missingReports || []);
        setCurrentWeekRange({ start: data.weekStarting, end: data.weekEnding });
      }
    } catch (error) {
      console.error('Error fetching missing reports:', error);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Reports</h1>
          <p className="text-gray-600 mt-1">View student reports by company</p>
        </div>
      </div>

      {/* Company Filter */}
      <Card className="mb-8 border-blue-100 shadow-sm">
        <CardHeader className="bg-blue-50 border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Filter className="h-5 w-5 text-blue-600" />
            Select Company
          </CardTitle>
          <CardDescription className="text-blue-700">
            Choose a company to view all registered students and reports
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyId" className="text-sm font-medium text-gray-700">
                Company
              </Label>
              <Select value={filters.companyId} onValueChange={(value) => handleFilterChange('companyId', value)}>
                <SelectTrigger id="companyId" className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Section */}
      {filters.companyId !== 'all' && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {companies.find(c => c.id.toString() === filters.companyId)?.name} Overview
            </h2>
          </div>

          <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Students ({students.length})
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recent Reports
              </TabsTrigger>
              <TabsTrigger value="missing" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Missing Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
              {students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map(student => (
                    <Card key={student.id} className="border-gray-200 hover:border-blue-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{student.full_name}</h4>
                              <p className="text-sm text-muted-foreground">{student.student_id}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 mb-3">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Course:</span> {student.course}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <Badge variant="outline" className="text-xs">
                            {Array.isArray(student.companies)
                              ? student.companies[0]?.name
                              : (student.companies as { name: string })?.name || 'No Company'}
                          </Badge>
                          <Link href={`/admin/students/${student.id}/reports`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Reports
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">No students found for this company</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Weekly Reports</CardTitle>
                  <CardDescription>
                    Latest reports submitted by students in this company
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentReports.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Week Of</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentReports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-semibold">{report.users.full_name}</div>
                                  <div className="text-xs text-muted-foreground">{report.users.student_id}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-gray-500" />
                                  {(() => {
                                    const start = new Date(report.week_starting);
                                    const end = new Date(report.week_ending);

                                    if (start.getFullYear() !== end.getFullYear()) {
                                      return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
                                    } else if (start.getMonth() !== end.getMonth()) {
                                      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
                                    } else {
                                      return `${format(start, 'MMM d')}–${format(end, 'd, yyyy')}`;
                                    }
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-gray-500" />
                                  {report.total_hours_worked} hrs
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(report.status)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(report.submitted_at), 'MMM d, h:mm a')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link href={`/admin/students/${report.student_id}/reports`}>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View</span>
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium text-gray-900">No reports found</p>
                      <p className="text-sm">There are no recent reports for this company.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="missing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Clock className="h-5 w-5" />
                    Missing Reports for Current Week
                  </CardTitle>
                  <CardDescription>
                    Students who have NOT submitted a weekly report for the week of{' '}
                    {currentWeekRange ? (
                      <span className="font-medium text-gray-900">
                        {format(new Date(currentWeekRange.start), 'MMM d')} – {format(new Date(currentWeekRange.end), 'MMM d, yyyy')}
                      </span>
                    ) : '...'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {missingReports.length > 0 ? (
                    <div className="rounded-md border bg-red-50/30">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {missingReports.map((student) => (
                            <TableRow key={student.id} className="hover:bg-red-50">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                                    {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </div>
                                  {student.full_name}
                                </div>
                              </TableCell>
                              <TableCell>{student.student_id}</TableCell>
                              <TableCell>{student.course}</TableCell>
                              <TableCell className="text-right">
                                <Link href={`/admin/students/${student.id}/reports`}>
                                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                    View Profile
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-lg font-medium text-green-700">All Caught Up!</p>
                      <p className="text-sm text-gray-600">All students in this company have submitted their reports for this week.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}