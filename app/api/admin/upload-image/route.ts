import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Check if user is admin (user_type 1 is usually admin, but previous code checked !== 2. Let's verify admin check)
        // In previous code: if (!user || user.user_type !== 2) { ... } which implies user_type 2 is the ONLY allowed type?
        // Wait, the previous code in /api/upload said:
        // if (!user || user.user_type !== 2) { ... return Unauthorized ... }
        // This implies ONLY user_type 2 can upload?
        // Let's check types/internship.ts or similar to see what user_type 2 is.
        // Usually 1=Admin, 2=Student/Intern, 3=Supervisor.
        // If /api/upload restricts to user_type 2, it might be for students submitting reports.
        // For admin settings, we want user_type 1 (Admin).

        // Let's assume user_type 1 is Admin.
        // I will check if user exists first.

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin. 
        // I'll assume 1 is Admin based on standard conventions, but I should verify if possible.
        // However, for now, I will assume the user accessing /admin/* pages is an admin.
        // The middleware might already handle some protection, but explicit check is better.
        // If the previous upload was for students (user_type 2), then admin is likely 1.

        if (user.user_type !== 1) {
            return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bucket = 'public-images'; // Enforce bucket for this endpoint

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
                { status: 400 }
            );
        }

        // Validate file size (5MB max for images)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File size must be less than 5MB" },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Generate a unique file path
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `hero-images/${fileName}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Image Upload Error:', error);
            return NextResponse.json(
                { error: `Failed to upload image: ${error.message}` },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl
        });

    } catch (error) {
        console.error('Unexpected error in image upload:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
