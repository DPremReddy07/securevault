// app/api/admin/terminate/route.js
// Admin-only endpoint: force-signs out and bans a suspicious user.
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  // Build an admin Supabase client (service role bypasses RLS)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set in environment" }, { status: 500 });
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify caller is an authenticated admin
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user: caller }, error: authErr } = await adminSupabase.auth.getUser(token);
  if (authErr || !caller) return Response.json({ error: "Invalid token" }, { status: 401 });

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (profile?.role !== "admin") {
    return Response.json({ error: "Admin role required" }, { status: 403 });
  }

  // Get target user ID from body
  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  // Safety: cannot terminate yourself
  if (userId === caller.id) {
    return Response.json({ error: "Cannot terminate your own session" }, { status: 400 });
  }

  try {
    // 1. Ban the user — invalidates all active sessions
    const { error: banErr } = await adminSupabase.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
    });
    if (banErr) throw banErr;

    // 2. Mark is_terminated in profiles (so dashboard detects and redirects on next load)
    await adminSupabase.from("profiles").update({ is_terminated: true }).eq("id", userId);

    // 3. Audit trail
    await adminSupabase.from("audit_logs").insert({
      user_id: caller.id,
      action: "TERMINATE",
      detail: `Admin terminated session for user_id: ${userId}`,
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message || "Terminate failed" }, { status: 500 });
  }
}
