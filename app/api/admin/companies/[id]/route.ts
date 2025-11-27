import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { requireAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin access
    const user = await requireAuth();
    if (!user || user.user_type !== 1) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();
    const companyId = parseInt(params.id);
    const data = await request.json();

    // Validate company ID
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
        { status: 400 }
      );
    }

    // Check if company exists
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (checkError || !existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    const requiredFields = ['name', 'contact', 'address'];
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim().length === 0) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate contact number format
    const contactRegex = /^[\+\d\s\-\(\)]+$/;
    if (!contactRegex.test(data.contact)) {
      return NextResponse.json(
        { error: "Please enter a valid contact number" },
        { status: 400 }
      );
    }

    // Validate GPS coordinates if provided
    if (data.latitude !== null && data.longitude !== null) {
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { error: "Please enter valid GPS coordinates" },
          { status: 400 }
        );
      }
      
      if (lat < -90 || lat > 90) {
        return NextResponse.json(
          { error: "Latitude must be between -90 and 90" },
          { status: 400 }
        );
      }
      
      if (lng < -180 || lng > 180) {
        return NextResponse.json(
          { error: "Longitude must be between -180 and 180" },
          { status: 400 }
        );
      }
    }

    // Validate radius
    const radius = parseInt(data.radius) || 100;
    if (radius < 10 || radius > 1000) {
      return NextResponse.json(
        { error: "Radius must be between 10 and 1000 meters" },
        { status: 400 }
      );
    }

    // Update company
    const { data: updatedCompany, error } = await supabase
      .from('companies')
      .update({
        name: data.name.trim(),
        contact_number: data.contact.trim(),
        address: data.address.trim()
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: "Company updated successfully",
        company: updatedCompany 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin access
    const user = await requireAuth();
    if (!user || user.user_type !== 1) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = createServiceRoleClient();
    const companyId = parseInt(id);

    // Validate company ID
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
        { status: 400 }
      );
    }

    // Check if company has assigned students
    const { count, error: checkError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (checkError) {
      return NextResponse.json(
        { error: "Error checking company assignments" },
        { status: 400 }
      );
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: "Cannot delete company with assigned students" },
        { status: 400 }
      );
    }

    // Delete company
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Company deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}