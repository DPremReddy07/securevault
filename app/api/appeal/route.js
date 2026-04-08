// app/api/appeal/route.js
// GET  ?userId=xxx  → return existing appeal for that user
// POST { userId, email, message } → submit new appeal (no auth required — user is banned)

import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return Response.json({ appeal: null });

  const { data } = await adminClient()
    .from("appeals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return Response.json({ appeal: data || null });
}

export async function POST(req) {
  const { userId, email, message } = await req.json().catch(() => ({}));

  if (!userId || !message?.trim()) {
    return Response.json({ error: "userId and message are required" }, { status: 400 });
  }

  const db = adminClient();

  // Check if appeal already exists
  const { data: existing } = await db
    .from("appeals")
    .select("id, status")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (existing) {
    if (existing.status === "pending") {
      return Response.json({ error: "An appeal is already pending review" }, { status: 409 });
    }
    // Allow resubmission if rejected
    const { error } = await db.from("appeals").update({ message: message.trim(), status: "pending", admin_note: null, reviewed_at: null, reviewed_by: null }).eq("id", existing.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true, resubmitted: true });
  }

  // New appeal
  const { error } = await db.from("appeals").insert({
    user_id: userId,
    user_email: email || null,
    message: message.trim(),
    status: "pending",
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
