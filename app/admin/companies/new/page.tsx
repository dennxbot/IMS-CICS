import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import CompanyForm from '@/components/admin/CompanyForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function NewCompany() {
  const user = await requireAuth();
  
  // Check if user is admin
  if (user.user_type !== 1) {
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Company</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
          Create a new company profile with location and geofencing settings
        </p>
      </div>

      <CompanyForm />
    </div>
  );
}