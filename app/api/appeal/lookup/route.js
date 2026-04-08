// app/api/appeal/lookup/route.js
// Allows a banned user to get their userId from their email alone.
// Used when the user is redirected from login (no active session, only email known).
// Uses service role to query auth.users safely.

import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.toLowerCase().trim();

  if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Look up the user by email using the admin API
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });

  const match = data.users.find(u => u.email?.toLowerCase() === email);
  if (!match) return Response.json({ error: "No account found with that email" }, { status: 404 });

  // Only allow lookup if the account is actually banned (banned_until set)
  const isBanned = match.banned_until && new Date(match.banned_until) > new Date();
  // Also check is_terminated flag in profiles as fallback
  const { data: profile } = await db.from("profiles").select("is_terminated").eq("id", match.id).single();

  if (!isBanned && !profile?.is_terminated) {
    return Response.json({ error: "This account is not currently suspended" }, { status: 403 });
  }

  return Response.json({ userId: match.id, email: match.email });
}
