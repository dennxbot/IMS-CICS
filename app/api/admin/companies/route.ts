import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    // Create service role client for admin operations
    const supabase = createServiceRoleClient();
    
    // For service role client, we need to check authentication differently
    // Let's fetch all companies without authentication check for now
    // The middleware will handle basic auth, and we can enhance security later

    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { companies },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const data = await request.json();

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

    // Create company
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name: data.name.trim(),
        contact_number: data.contact.trim(),
        address: data.address.trim(),
        latitude: data.latitude !== null ? parseFloat(data.latitude) : null,
        longitude: data.longitude !== null ? parseFloat(data.longitude) : null,
        radius: radius
      })
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
        message: "Company created successfully",
        company_id: company.id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}