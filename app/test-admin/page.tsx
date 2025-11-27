import { createClient } from "@/utils/supabase/server";

export default async function TestAdminUser() {
  const supabase = createClient();
  
  // Check if admin user exists
  const { data: adminUser, error } = await supabase
    .from('users')
    .select('id, email, full_name, user_type')
    .eq('email', 'admin@example.com')
    .single();
    
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error fetching admin user</h1>
        <p className="text-red-500">{error.message}</p>
      </div>
    );
  }
  
  if (!adminUser) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-orange-600">Admin user not found</h1>
        <p className="text-gray-600">The admin user may not have been created yet.</p>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-600">Admin User Found!</h1>
      <div className="mt-4 space-y-2">
        <p><strong>ID:</strong> {adminUser.id}</p>
        <p><strong>Email:</strong> {adminUser.email}</p>
        <p><strong>Name:</strong> {adminUser.full_name}</p>
        <p><strong>User Type:</strong> {adminUser.user_type}</p>
      </div>
    </div>
  );
}