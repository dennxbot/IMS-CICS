'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapIcon, Save, X } from 'lucide-react';

interface CompanyFormProps {
  company?: {
    id: number;
    name: string;
    contact_number: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    radius: number;
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
  };
}

export default function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: company?.name || '',
    contact: company?.contact_number || '',
    address: company?.address || '',
    latitude: company?.latitude?.toString() || '',
    longitude: company?.longitude?.toString() || '',
    radius: company?.radius?.toString() || '100',
    total_required_hours: company?.total_required_hours?.toString() || '500',
    working_days: company?.working_days || '1,2,3,4,5',
    daily_hours_limit: company?.daily_hours_limit?.toString() || '8.0',
    max_weekly_hours: company?.max_weekly_hours?.toString() || '40.0',
    contact_person: company?.contact_person || '',
    contact_email: company?.contact_email || '',
    industry_type: company?.industry_type || '',
    company_size: company?.company_size || '',
    website: company?.website || '',
    description: company?.description || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.contact.trim() || !formData.address.trim()) {
        throw new Error('Please fill in all required fields');
      }

      // Validate contact number format
      const contactRegex = /^[\+\d\s\-\(\)]+$/;
      if (!contactRegex.test(formData.contact)) {
        throw new Error('Please enter a valid contact number');
      }

      // Validate GPS coordinates
      if (formData.latitude && formData.longitude) {
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);

        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Please enter valid GPS coordinates');
        }

        if (lat < -90 || lat > 90) {
          throw new Error('Latitude must be between -90 and 90');
        }

        if (lng < -180 || lng > 180) {
          throw new Error('Longitude must be between -180 and 180');
        }
      }

      // Validate radius
      const radius = parseInt(formData.radius);
      if (isNaN(radius) || radius < 10 || radius > 1000) {
        throw new Error('Radius must be between 10 and 1000 meters');
      }

      // Validate time allocation fields
      const totalRequiredHours = parseFloat(formData.total_required_hours);
      if (isNaN(totalRequiredHours) || totalRequiredHours < 0 || totalRequiredHours > 2000) {
        throw new Error('Total required hours must be between 0 and 2000');
      }

      const dailyHoursLimit = parseFloat(formData.daily_hours_limit);
      if (isNaN(dailyHoursLimit) || dailyHoursLimit < 1 || dailyHoursLimit > 24) {
        throw new Error('Daily hours limit must be between 1 and 24');
      }

      const maxWeeklyHours = parseFloat(formData.max_weekly_hours);
      if (isNaN(maxWeeklyHours) || maxWeeklyHours < 1 || maxWeeklyHours > 168) {
        throw new Error('Max weekly hours must be between 1 and 168');
      }

      // Validate working days format
      const workingDaysArray = formData.working_days.split(',').map(day => parseInt(day.trim()));
      const validDays = [1, 2, 3, 4, 5, 6, 7]; // Monday to Sunday
      if (!workingDaysArray.every(day => validDays.includes(day))) {
        throw new Error('Working days must be numbers 1-7 (1=Monday, 7=Sunday)');
      }

      // Prepare the data
      const submissionData = {
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        address: formData.address.trim(),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        radius: radius,
        total_required_hours: totalRequiredHours,
        working_days: formData.working_days,
        daily_hours_limit: dailyHoursLimit,
        max_weekly_hours: maxWeeklyHours,
        contact_person: formData.contact_person.trim(),
        contact_email: formData.contact_email.trim(),
        industry_type: formData.industry_type.trim(),
        company_size: formData.company_size.trim(),
        website: formData.website.trim(),
        description: formData.description.trim()
      };

      const url = company ? `/api/admin/companies/${company.id}` : '/api/admin/companies';
      const method = company ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save company');
      }

      // Success - redirect to companies list
      router.push('/admin/companies');
      router.refresh();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
      },
      (error) => {
        setError('Unable to retrieve your location: ' + error.message);
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Company Information</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {company ? 'Update company details' : 'Add a new company to the system'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter company name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person" className="text-sm sm:text-base">
                Contact Person
              </Label>
              <Input
                id="contact_person"
                name="contact_person"
                placeholder="e.g., John Doe"
                value={formData.contact_person}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="text-sm sm:text-base">
                Contact Email
              </Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="e.g., john@company.com"
                value={formData.contact_email}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact" className="text-sm sm:text-base">
              Contact Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact"
              name="contact"
              placeholder="e.g., +63 123 456 7890"
              value={formData.contact}
              onChange={handleInputChange}
              required
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm sm:text-base">
              Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Enter complete address"
              value={formData.address}
              onChange={handleInputChange}
              required
              rows={3}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry_type" className="text-sm sm:text-base">
                Industry Type
              </Label>
              <Input
                id="industry_type"
                name="industry_type"
                placeholder="e.g., Technology, Healthcare"
                value={formData.industry_type}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_size" className="text-sm sm:text-base">
                Company Size
              </Label>
              <Input
                id="company_size"
                name="company_size"
                placeholder="e.g., 50-100 employees"
                value={formData.company_size}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm sm:text-base">
              Website
            </Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="e.g., https://example.com"
              value={formData.website}
              onChange={handleInputChange}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm sm:text-base">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of the company"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Internship Requirements</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Set the total hours required and working schedule for students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total_required_hours" className="text-sm sm:text-base">
              Total Required Hours <span className="text-red-500">*</span>
            </Label>
            <Input
              id="total_required_hours"
              name="total_required_hours"
              type="number"
              min="0"
              max="2000"
              placeholder="500"
              value={formData.total_required_hours}
              onChange={handleInputChange}
              required
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-gray-500">
              Total internship hours students must complete
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="working_days" className="text-sm sm:text-base">
              Working Days <span className="text-red-500">*</span>
            </Label>
            <Input
              id="working_days"
              name="working_days"
              placeholder="1,2,3,4,5"
              value={formData.working_days}
              onChange={handleInputChange}
              required
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-gray-500">
              Comma-separated days (1=Monday, 7=Sunday). Example: 1,2,3,4,5 for Monday-Friday
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily_hours_limit" className="text-sm sm:text-base">
                Daily Hours Limit <span className="text-red-500">*</span>
              </Label>
              <Input
                id="daily_hours_limit"
                name="daily_hours_limit"
                type="number"
                min="1"
                max="24"
                step="0.5"
                placeholder="8.0"
                value={formData.daily_hours_limit}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
              />
              <p className="text-xs sm:text-sm text-gray-500">
                Maximum hours per day
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_weekly_hours" className="text-sm sm:text-base">
                Max Weekly Hours <span className="text-red-500">*</span>
              </Label>
              <Input
                id="max_weekly_hours"
                name="max_weekly_hours"
                type="number"
                min="1"
                max="168"
                step="0.5"
                placeholder="40.0"
                value={formData.max_weekly_hours}
                onChange={handleInputChange}
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
              />
              <p className="text-xs sm:text-sm text-gray-500">
                Maximum hours per week
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Location Settings</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            GPS coordinates and geofencing settings for attendance tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude" className="text-sm sm:text-base">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                placeholder="e.g., 14.5995"
                value={formData.latitude}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude" className="text-sm sm:text-base">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                placeholder="e.g., 120.9842"
                value={formData.longitude}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            <MapIcon className="w-4 h-4 mr-2" />
            Use Current Location
          </Button>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="radius" className="text-sm sm:text-base">
              Geofence Radius (meters) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="radius"
              name="radius"
              type="number"
              min="10"
              max="1000"
              placeholder="100"
              value={formData.radius}
              onChange={handleInputChange}
              required
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-gray-500">
              Maximum distance allowed from company location for clock-in (10-1000 meters)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/companies')}
          disabled={isLoading}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {company ? 'Update Company' : 'Create Company'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}