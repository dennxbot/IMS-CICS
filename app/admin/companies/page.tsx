import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CompaniesListClient from '@/components/admin/CompaniesListClient';
import { 
  MapIcon, 
  Users,
  Plus,
  Building2
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
}

async function getCompanies(): Promise<Company[]> {
  const supabase = createServiceRoleClient();
  
  const { data: companies, error } = await supabase
    .from('companies')
    .select(`
      *,
      users!company_id(count)
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }

  return companies.map(company => ({
    ...company,
    student_count: company.users?.[0]?.count || 0
  })) || [];
}

export default async function AdminCompanies() {
  const user = await requireAuth();
  
  // Check if user is admin
  if (user.user_type !== 1) {
    notFound();
  }

  const companies = await getCompanies();

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Company Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage company information and geofencing settings</p>
        </div>
        <Link href="/admin/companies/new">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add New Company
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies with GPS</CardTitle>
            <MapIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter(c => c.latitude && c.longitude).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.reduce((sum, company) => sum + company.student_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies List */}
      <CompaniesListClient initialCompanies={companies} />
    </div>
  );
}