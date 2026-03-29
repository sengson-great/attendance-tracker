'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create a high-privilege Supabase client using the Service Role Key
// This allows the server to bypass RLS for necessary writes.
function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("🚨 CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from .env!");
    // We fall back temporarily to the anon key, but writes will fail if RLS is enabled.
  }
  
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

// ----------------------------------------------------
// Admin Secure Actions (Requires admin_session cookie)
// ----------------------------------------------------

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    throw new Error('Unauthorized');
  }
}

export async function addEmployeeAction(employeeData: any) {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from('employees').insert([employeeData]).select();
  if (error) {
    console.error("Supabase Error (addEmployee):", error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateEmployeeAction(id: string, updates: any) {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  const { error } = await supabase.from('employees').update(updates).eq('id', id);
  if (error) throw error;
  return true;
}

export async function deleteEmployeeAction(id: string) {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  // Using logical delete (active = false)
  const { error } = await supabase.from('employees').update({ active: false }).eq('id', id);
  if (error) throw error;
  return true;
}

export async function updateSchoolSettingsAction(settingsData: any) {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  const { error } = await supabase.from('school_settings').update(settingsData).eq('id', 1);
  if (error) throw error;
  return true;
}

export async function fetchAdminDataAction() {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  
  const [employeesRaw, attendanceRaw, settingsRaw] = await Promise.all([
    supabase.from('employees').select('*').eq('active', true).order('full_name'),
    supabase.from('attendance').select('*').order('check_in'),
    supabase.from('school_settings').select('school_start_hour, school_start_minute, grace_period').eq('id', 1).single()
  ]);

  return {
    employees: employeesRaw.data || [],
    attendance: attendanceRaw.data || [],
    settings: settingsRaw.data
  };
}

// ----------------------------------------------------
// Public Secure Actions (No admin session required)
// ----------------------------------------------------

export async function recordAttendanceAction(attendanceData: any) {
  // We don't check verifyAdmin() because /scan is public.
  // Using Server Actions prevents attackers from executing arbitrary INSERTs using the public Anon Key.
  // The server controls the exact payload structure, and we enforce a server-side timestamp to prevent spoofing check-in times.
  
  const supabase = getAdminSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Verify the employee exists
  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('id', attendanceData.employee_id)
    .single();

  if (!employee) throw new Error("Employee not found");

  // Prevent duplicate check-ins for today
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    return { alreadyCheckedIn: true };
  }

  // Enforce secure server-side timestamps instead of depending on the client payload
  const now = new Date();
  
  // Calculate late status
  const { data: config } = await supabase.from('school_settings').select('school_start_hour, school_start_minute, grace_period').eq('id', 1).single();
  
  let status = attendanceData.status;
  let minutes = attendanceData.late_minutes;

  if (config) {
    const startTime = new Date(now);
    startTime.setHours(config.school_start_hour, config.school_start_minute, 0);

    const diffMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));

    if (diffMinutes <= config.grace_period) {
      status = 'on-time';
      minutes = 0;
    } else if (diffMinutes <= 30) {
      status = 'late';
      minutes = diffMinutes;
    } else {
      status = 'very-late';
      minutes = diffMinutes;
    }
  }

  // Safely insert exact permitted fields
  const safeData = {
    employee_id: employee.id,
    employee_name: employee.full_name,
    check_in: now.toISOString(),
    date: today,
    location: attendanceData.location || "ច្រកចូលក្រុមហ៊ុន ឬស្ថាប័ន",
    location_lat: attendanceData.location_lat,
    location_lng: attendanceData.location_lng,
    location_verified: attendanceData.location_verified,
    distance_from_school: attendanceData.distance_from_school,
    verification_method: ['gps'],
    status: status
  };

  const { data: newAttendance, error } = await supabase
    .from('attendance')
    .insert([safeData])
    .select()
    .single();

  if (error) {
    console.error("Supabase Error (recordAttendance):", error);
    throw new Error(JSON.stringify(error));
  }

  return { attendance: newAttendance, status, minutes };
}
