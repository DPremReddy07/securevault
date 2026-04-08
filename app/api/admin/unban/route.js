// app/api/admin/unban/route.js
// Admin-only: approve or reject a user appeal.
// action: "approve" → unban user + mark appeal approved
// action: "reject"  → keep ban + mark appeal rejected

import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return Response.json({ error: "Service role key not configured" }, { status: 500 });

  const db = getAdminClient();

  // Verify caller is an admin
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user: caller } } = await db.auth.getUser(token);
  if (!caller) return Response.json({ error: "Invalid token" }, { status: 401 });

  const { data: profile } = await db.from("profiles").select("role").eq("id", caller.id).single();
  if (profile?.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

  const { userId, appealId, action = "approve", adminNote = "" } = await req.json().catch(() => ({}));
  if (!userId || !appealId) return Response.json({ error: "Missing userId or appealId" }, { status: 400 });

  if (action === "approve") {
    // 1. Unban in Supabase Auth
    const { error: banErr } = await db.auth.admin.updateUserById(userId, { ban_duration: "none" });
    if (banErr) return Response.json({ error: "Unban failed: " + banErr.message }, { status: 500 });

    // 2. Clear is_terminated in profiles
    await db.from("profiles").update({ is_terminated: false }).eq("id", userId);

    // 3. Update appeal status
    await db.from("appeals").update({
      status: "approved",
      admin_note: adminNote || "Appeal approved by admin.",
      reviewed_by: caller.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", appealId);

    // 4. Audit trail
    await db.from("audit_logs").insert({
      user_id: caller.id,
      action: "UNBAN",
      detail: `Admin approved appeal and unbanned user_id: ${userId}`,
    });

    return Response.json({ success: true, action: "unbanned" });
  }

  if (action === "reject") {
    await db.from("appeals").update({
      status: "rejected",
      admin_note: adminNote || "Appeal rejected by admin.",
      reviewed_by: caller.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", appealId);

    await db.from("audit_logs").insert({
      user_id: caller.id,
      action: "REJECT_APPEAL",
      detail: `Admin rejected appeal for user_id: ${userId}`,
    });

    return Response.json({ success: true, action: "rejected" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
