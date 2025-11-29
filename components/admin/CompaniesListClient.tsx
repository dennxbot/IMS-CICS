'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DeleteCompanyDialog from '@/components/admin/DeleteCompanyDialog';
import {
  Building2,
  MapPin,
  Phone,
  MapIcon,
  Edit,
  Plus,
  Clock,
  User,
  Mail,
  Globe
} from 'lucide-react';

interface Company {
  id: number;
  name: string;
  contact_number: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  radius: number;
  created_at: string;
  student_count: number;
  total_required_hours?: number;
  working_days?: string;
  daily_hours_limit?: number;
  max_weekly_hours?: number;
  contact_person?: string;
  contact_email?: string;
  industry_type?: string;
  company_size?: string;
  website?: string;
  description?: string;
}

interface CompaniesListClientProps {
  initialCompanies: Company[];
}

export default function CompaniesListClient({ initialCompanies }: CompaniesListClientProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);

  const handleDeleteCompany = async (companyId: number) => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setCompanies(companies.filter(company => company.id !== companyId));
      } else {
        const error = await response.json();
        console.error('Error deleting company:', error);
        alert('Failed to delete company. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('An error occurred while deleting the company.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {companies.length === 0 ? (
        <div className="col-span-full text-center py-8 sm:py-12">
          <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No companies found</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Get started by adding your first company.</p>
          <Link href="/admin/companies/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Company
            </Button>
          </Link>
        </div>
      ) : (
        companies.map((company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    {company.name}
                    {company.industry_type && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {company.industry_type}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {company.student_count} student{company.student_count !== 1 ? 's' : ''} assigned
                    {company.company_size && ` • ${company.company_size}`}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/admin/companies/${company.id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <DeleteCompanyDialog
                    companyId={company.id}
                    companyName={company.name}
                    onDelete={handleDeleteCompany}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.description && (
                <p className="text-xs text-gray-600 line-clamp-2 italic">
                  {company.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    <span>{company.contact_person || 'No contact person'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs sm:text-sm">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    <span>{company.contact_number}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {company.contact_email && (
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="truncate">{company.contact_email}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2 text-xs sm:text-sm pt-2 border-t">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mt-0.5" />
                <span className="flex-1">{company.address}</span>
              </div>

              {company.latitude && company.longitude && (
                <div className="flex items-center space-x-2">
                  <MapIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium">GPS:</span> {company.latitude.toFixed(6)}, {company.longitude.toFixed(6)}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {company.radius}m radius
                    </Badge>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t mt-2">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span className="text-xs sm:text-sm font-medium">Requirements</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 pl-5 sm:pl-6">
                  <div>Required: <span className="font-medium">{company.total_required_hours || 0}h</span></div>
                  <div>Daily Limit: <span className="font-medium">{company.daily_hours_limit || 8}h</span></div>
                  <div>Weekly Max: <span className="font-medium">{company.max_weekly_hours || 40}h</span></div>
                  <div>Days: <span className="font-medium">{company.working_days || 'Mon-Fri'}</span></div>
                </div>
              </div>

              <div className="text-xs text-gray-500 pt-2">
                Created {new Date(company.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}