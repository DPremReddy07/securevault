// hooks/useRealtime.js
// Manages Supabase Realtime subscriptions for audit_logs and login_logs.
// Automatically cleans up channels on unmount.

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

/**
 * Subscribe to live audit_log inserts.
 * New rows are prepended to the auditLogs list (capped at 50).
 *
 * @param {object|null} user
 * @param {boolean}     isAdmin
 * @param {Function}    setAuditLogs  React state setter
 */
export function useAuditRealtime(user, isAdmin, setAuditLogs) {
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("rt:audit_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        ({ new: row }) => {
          if (!isAdmin && row.user_id !== user.id) return;
          setAuditLogs(p => [row, ...p].slice(0, 50));
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user, isAdmin, setAuditLogs]);
}

/**
 * Subscribe to live login_log inserts.
 * - All logins prepend to loginHistory.
 * - Flagged logins also prepend to threats and fire a toast.
 * - Newly arrived rows get a temporary `_new: true` marker for animations.
 *
 * @param {object|null} user
 * @param {boolean}     isAdmin
 * @param {Function}    setLoginHistory  React state setter
 * @param {Function}    setThreats       React state setter
 * @param {Function}    setNewLoginId    React state setter (for map animation)
 */
export function useLoginRealtime(user, isAdmin, setLoginHistory, setThreats, setNewLoginId) {
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("rt:login_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "login_logs" },
        ({ new: row }) => {
          if (!isAdmin && row.user_id !== user.id) return;

          // Always push to login history
          setLoginHistory(p => [row, ...p].slice(0, 20));
          setNewLoginId(row.id);
          setTimeout(() => setNewLoginId(null), 3500);

          if (row.threat_flag) {
            setThreats(p => [{ ...row, dismissed: false }, ...p].slice(0, 30));
            toast(
              `🚨 ${row.threat_flag === "impossible_travel"
                ? "Impossible travel detected!"
                : `New country login: ${row.country}`}`,
              { duration: 6000, style: { background: "#7f1d1d", color: "#fff" } }
            );
          } else {
            toast(
              `📍 New login: ${[row.city, row.country].filter(Boolean).join(", ") || "Unknown"}`,
              { duration: 3000, style: { background: "#064e3b", color: "#d1fae5" } }
            );
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user, isAdmin, setLoginHistory, setThreats, setNewLoginId]);
}
