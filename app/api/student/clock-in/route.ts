import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { clockIn } from "@/lib/student";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.user_type !== 2) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const session = body.session as 1 | 2;
    const location = body.location;
    const remarks = body.remarks;

    if (!session || (session !== 1 && session !== 2)) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 400 }
      );
    }

    const result = await clockIn(user.id, session, location, remarks);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to clock in";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}