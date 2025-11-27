import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API: Starting upload process');
    
    const user = await getCurrentUser();
    
    if (!user || user.user_type !== 2) {
      console.log('Upload API: Unauthorized access attempt', { user: user?.id, userType: user?.user_type });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('Upload API: User authenticated', user.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    const bucket = formData.get('bucket') as string;

    console.log('Upload API: Received form data', { 
      hasFile: !!file, 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      path, 
      bucket 
    });

    if (!file || !path || !bucket) {
      return NextResponse.json(
        { error: "Missing required fields: file, path, or bucket" },
        { status: 400 }
      );
    }

    // Validate bucket
    if (bucket !== 'weekly-reports') {
      console.log('Upload API: Invalid bucket', bucket);
      return NextResponse.json(
        { error: "Invalid bucket" },
        { status: 400 }
      );
    }

    // Validate file path belongs to the user
    const pathParts = path.split('/');
    console.log('Upload API: Path validation', { 
      path, 
      pathParts, 
      expectedUserId: user.id, 
      firstPart: pathParts[0] 
    });
    
    if (pathParts[0] !== user.id) {
      console.log('Upload API: Path validation failed');
      return NextResponse.json(
        { error: "Unauthorized: Invalid file path" },
        { status: 403 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/pdf',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: Word documents, PDF, or text files" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // First, check if the bucket exists
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      console.log('Upload API: Available buckets:', buckets?.map(b => b.id));
      if (bucketError) {
        console.error('Upload API: Error listing buckets:', bucketError);
      }
    } catch (bucketListError) {
      console.error('Upload API: Error checking buckets:', bucketListError);
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Upload API: Attempting Supabase storage upload', { bucket, path, fileSize: buffer.length });

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      console.error('Upload API: Supabase storage error:', error);
      return NextResponse.json(
        { error: `Failed to upload file: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Upload API: Supabase upload successful', data);

    // Create a public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!publicUrlData) {
      console.error('Upload API: No public URL data returned');
      throw new Error('Failed to generate public URL - no data returned');
    }

    const publicUrl = publicUrlData?.publicUrl;
    console.log('Upload API: Generated public URL', publicUrl);

    if (!publicUrl) {
      console.error('Upload API: No public URL generated', { publicUrlData });
      throw new Error('Failed to generate public URL - no URL returned');
    }

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        fullPath: `${bucket}/${data.path}`,
        publicUrl,
        size: file.size,
        type: file.type
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    console.error('Upload API: Unexpected error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}