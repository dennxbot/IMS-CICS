"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye,
  Filter,
  Users
} from 'lucide-react';

interface ReportFilters {
  companyId?: string;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  course: string;
  company_id: number;
  companies: {
    name: string;
  }[];
}

interface Company {
  id: number;
  name: string;
}

export default function AdminReportsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    companyId: 'all'
  });

  // Handle filter changes
  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    if (key === 'companyId' && value !== 'all') {
      fetchStudentsByCompany(value);
    } else if (key === 'companyId' && value === 'all') {
      setStudents([]);
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

  useEffect(() => {
    fetchCompanies();
  }, []);

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
            Choose a company to view all registered students
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

      {/* Students Section */}
      {filters.companyId !== 'all' && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Students in {companies.find(c => c.id.toString() === filters.companyId)?.name}
            </h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {students.length} students
            </Badge>
          </div>
          
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
                        {student.companies?.[0]?.name || 'No Company'}
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
        </div>
      )}
    </div>
  );
}