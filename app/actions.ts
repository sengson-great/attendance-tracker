"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { processCheckinNotification } from "@/lib/telegram";

// Create a high-privilege Supabase client using the Service Role Key
// This allows the server to bypass RLS for necessary writes.
function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "🚨 CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from .env!",
    );
    // We fall back temporarily to the anon key, but writes will fail if RLS is enabled.
  }

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

// ----------------------------------------------------
// Admin Secure Actions (Requires admin_session cookie)
// ----------------------------------------------------

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session?.value) {
    throw new Error("Unauthorized");
  }
  const payload = await verifySession(session.value);
  if (!payload?.admin) {
    throw new Error("Unauthorized");
  }
}

export async function addEmployeeAction(employeeData: any) {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("employees")
    .insert([employeeData])
    .select();
  if (error) {
    console.error("Supabase Error (addEmployee):", error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateEmployeeAction(id: string, updates: any) {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function deleteEmployeeAction(id: string) {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  // Using logical delete (active = false)
  const { error } = await supabase
    .from("employees")
    .update({ active: false })
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function getAdminSchoolSettingsAction() {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("school_settings")
    .select(
      "school_name, latitude, longitude, allowed_radius, school_start_hour, school_start_minute, grace_period",
    )
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data;
}

export async function verifyPinAction(pin: string) {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("school_settings")
    .select("admin_pin")
    .eq("id", 1)
    .single();
  return data?.admin_pin === pin;
}

export async function updateSchoolSettingsAction(settingsData: any) {
  await verifyAdmin();
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("school_settings")
    .update(settingsData)
    .eq("id", 1);
  if (error) throw error;
  return true;
}

export async function fetchAdminDataAction(selectedDate?: string) {
  await verifyAdmin();
  const supabase = getAdminSupabase();

  let attendanceQuery = supabase
    .from("attendance")
    .select("*")
    .order("check_in");
  if (selectedDate) attendanceQuery = attendanceQuery.eq("date", selectedDate);

  const [employeesRaw, attendanceRaw, settingsRaw] = await Promise.all([
    supabase
      .from("employees")
      .select("*")
      .eq("active", true)
      .order("full_name"),
    attendanceQuery,
    supabase
      .from("school_settings")
      .select("school_start_hour, school_start_minute, grace_period")
      .eq("id", 1)
      .single(),
  ]);

  return {
    employees: employeesRaw.data || [],
    attendance: attendanceRaw.data || [],
    settings: settingsRaw.data,
  };
}

// ----------------------------------------------------
// Public Secure Actions (No admin session required)
// ----------------------------------------------------

export async function getPublicEmployeesAction() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_id, full_name, department, emoji")
    .eq("active", true)
    .order("full_name");
  if (error) throw new Error(error.message);
  return data;
}

export async function getPublicSchoolSettingsAction() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("school_settings")
    .select("latitude, longitude, allowed_radius")
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function recordAttendanceAction(attendanceData: any) {
  // We don't check verifyAdmin() because /scan is public.
  // Using Server Actions prevents attackers from executing arbitrary INSERTs using the public Anon Key.
  // The server controls the exact payload structure, and we enforce a server-side timestamp to prevent spoofing check-in times.

  const supabase = getAdminSupabase();
  const today = new Date().toISOString().split("T")[0];

  // Verify the employee exists
  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("id", attendanceData.employee_id)
    .single();

  if (!employee) throw new Error("Employee not found");

  // Prevent duplicate check-ins for today
  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("employee_id", employee.id)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    return { alreadyCheckedIn: true };
  }

  // Enforce secure server-side timestamps instead of depending on the client payload
  const now = new Date();

  // Calculate late status
  const { data: config } = await supabase
    .from("school_settings")
    .select("school_start_hour, school_start_minute, grace_period")
    .eq("id", 1)
    .single();

  let status = attendanceData.status;
  let minutes = attendanceData.late_minutes;

  if (config) {
    const startTime = new Date(now);
    startTime.setHours(config.school_start_hour, config.school_start_minute, 0);

    const diffMinutes = Math.floor(
      (now.getTime() - startTime.getTime()) / (1000 * 60),
    );

    if (diffMinutes <= config.grace_period) {
      status = "on-time";
      minutes = 0;
    } else if (diffMinutes <= 30) {
      status = "late";
      minutes = diffMinutes;
    } else {
      status = "very-late";
      minutes = diffMinutes;
    }
  }
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  let isVerified = false;
  let serverDistance = null;

  if (config && attendanceData.location_lat && attendanceData.location_lng) {
    const { latitude, longitude, allowed_radius } = config as any;
    if (latitude && longitude && allowed_radius) {
      serverDistance = calculateDistance(
        attendanceData.location_lat,
        attendanceData.location_lng,
        latitude,
        longitude,
      );
      if (serverDistance <= allowed_radius) {
        isVerified = true;
      } else {
        throw new Error("Location spoofing detected. Outside allowed radius.");
      }
    }
  } else if (config && (config as any).allowed_radius) {
    throw new Error("Location coordinates missing on server verification.");
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
    location_verified: isVerified,
    distance_from_school: serverDistance,
    verification_method: ["gps"],
    status: status,
  };

  const { data: newAttendance, error } = await supabase
    .from("attendance")
    .insert([safeData])
    .select()
    .single();

  if (error) {
    console.error("Supabase Error (recordAttendance):", error);
    throw new Error(JSON.stringify(error));
  }

  // Asynchronously dispatch the telegram message securely from the backend!
  try {
    processCheckinNotification({
      ...safeData,
      lateMinutes: minutes,
    }).catch((e) => console.error("Telegram notification error:", e));
  } catch (e) {
    // We don't fail the checkin just because telegram failed
  }

  return { attendance: newAttendance, status, minutes };
}
