import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notificationId = params.id;

        // Delete the specific notification
        // Ensure it belongs to the user for security
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting notification:', error);
            return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in notification DELETE:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
