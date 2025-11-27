import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import CompanyForm from '@/components/admin/CompanyForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Company {
  id: number;
  name: string;
  contact_number: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  radius: number;
}

async function getCompany(id: string): Promise<Company | null> {
  const supabase = createServiceRoleClient();
  
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', parseInt(id))
    .single();

  if (error || !company) {
    return null;
  }

  return company;
}

export default async function EditCompany({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth();
  
  // Check if user is admin
  if (user.user_type !== 1) {
    notFound();
  }

  const { id } = await params;
  const company = await getCompany(id);
  
  if (!company) {
    notFound();
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4 max-w-4xl">
      <div className="mb-4 sm:mb-6">
        <Link href="/admin/companies">
          <Button variant="outline" size="sm" className="mb-3 sm:mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Button>
        </Link>
      </div>

      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Company</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
          Update company information and location settings
        </p>
      </div>

      <CompanyForm company={company} />
    </div>
  );
}