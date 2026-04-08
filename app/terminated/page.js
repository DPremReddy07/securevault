// app/terminated/page.js
// Shown when a user's account has been suspended by admin.
// Lets them submit an appeal. Reads identity from localStorage (stored by dashboard before redirect).
"use client";

import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Send, CheckCircle, Clock } from "lucide-react";

export default function TerminatedPage() {
  const [userData, setUserData]   = useState(null);
  const [emailInput, setEmailInput] = useState(""); // fallback if userId unknown
  const [message, setMessage]     = useState("");
  const [submitted, setSubmitted]  = useState(false);
  const [existing, setExisting]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("sv_terminated_user") || "null");
      if (stored?.userId) {
        setUserData(stored);
        checkExistingAppeal(stored.userId);
      } else if (stored?.email) {
        // Came from login page — have email but not userId yet
        setEmailInput(stored.email);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch { setLoading(false); }
  }, []);

  async function lookupByEmail(e) {
    e.preventDefault();
    if (!emailInput.trim()) { setError("Enter your account email."); return; }
    setLookingUp(true); setError("");
    try {
      const res = await fetch(`/api/appeal/lookup?email=${encodeURIComponent(emailInput.trim())}`);
      const d = await res.json();
      if (!res.ok || !d.userId) throw new Error(d.error || "Account not found or not suspended.");
      const ud = { userId: d.userId, email: emailInput.trim() };
      setUserData(ud);
      localStorage.setItem("sv_terminated_user", JSON.stringify(ud));
      checkExistingAppeal(d.userId);
    } catch (err) { setError(err.message); }
    finally { setLookingUp(false); }
  }

  async function checkExistingAppeal(userId) {
    try {
      const res = await fetch(`/api/appeal?userId=${userId}`);
      if (res.ok) { const d = await res.json(); setExisting(d.appeal || null); }
    } catch {}
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) { setError("Please explain your situation."); return; }
    if (!userData?.userId) { setError("Could not identify your account. Contact support."); return; }
    setSending(true); setError("");
    try {
      const res = await fetch("/api/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.userId, email: userData.email, message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  }

  const statusColor = { pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444" };
  const statusIcon  = { pending: "⏳", approved: "✅", rejected: "❌" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0f", color: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea:focus, input:focus { outline: none !important; border-color: #6c63ff !important; }
        .fade-in { animation: fadeIn .4s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <div className="fade-in" style={{ width: "100%", maxWidth: 520 }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32, opacity: 0.6 }}>
          <Shield size={20} color="#6c63ff" />
          <span style={{ fontWeight: 800, fontSize: 16 }}>SecureVault</span>
        </div>

        {/* Warning card */}
        <div style={{ background: "rgba(127,29,29,.2)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, textAlign: "center" }}>
          <AlertTriangle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f87171", marginBottom: 8 }}>Account Suspended</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
            Your account has been temporarily suspended by a security administrator due to a detected anomaly.
            Your data is <strong style={{ color: "#e2e8f0" }}>safe and not deleted</strong>.
          </p>
          {userData?.email && (
            <div style={{ marginTop: 12, fontSize: 12, fontFamily: "monospace", color: "#64748b", padding: "4px 10px", background: "#ffffff08", borderRadius: 6, display: "inline-block" }}>
              {userData.email}
            </div>
          )}
        </div>

        {/* Existing appeal status */}
        {!loading && existing && (
          <div style={{ background: "#161b24", border: `1px solid ${statusColor[existing.status]}30`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{statusIcon[existing.status]}</span>
              <span style={{ fontWeight: 700, color: statusColor[existing.status] }}>
                Appeal {existing.status.charAt(0).toUpperCase() + existing.status.slice(1)}
              </span>
              {existing.status === "pending" && <span className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", marginLeft: "auto" }} />}
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{existing.message}</p>
            {existing.status === "pending" && (
              <p style={{ fontSize: 12, color: "#64748b" }}>Under review. You will be notified when a decision is made.</p>
            )}
            {existing.status === "approved" && (
              <div style={{ background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 8, padding: "10px 14px", marginTop: 10 }}>
                <p style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>✅ Your appeal was approved! Try signing in again.</p>
                <a href="/" style={{ fontSize: 12, color: "#22d3ee", marginTop: 6, display: "inline-block" }}>→ Go to Login</a>
              </div>
            )}
            {existing.status === "rejected" && (
              <div>
                <p style={{ fontSize: 12, color: "#94a3b8" }}>If you believe this is incorrect, contact support.</p>
                {existing.admin_note && <p style={{ fontSize: 12, color: "#64748b", marginTop: 6, fontStyle: "italic" }}>Admin note: {existing.admin_note}</p>}
              </div>
            )}
          </div>
        )}

        {/* Email lookup step — when userId is unknown (came from login ban redirect) */}
        {!loading && !userData && !submitted && (
          <div style={{ background: "#161b24", border: "1px solid #ffffff12", borderRadius: 14, padding: "24px 24px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Confirm Your Identity</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 18, lineHeight: 1.6 }}>
              Enter the email address linked to your suspended account so we can verify your identity and let you submit an appeal.
            </p>
            <form onSubmit={lookupByEmail}>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="your@email.com"
                style={{ width: "100%", padding: "11px 14px", background: "#1c2130", border: "1px solid #ffffff15", borderRadius: 10, color: "#e2e8f0", fontSize: 13, marginBottom: 10, fontFamily: "inherit" }}
              />
              {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{error}</p>}
              <button type="submit" disabled={lookingUp || !emailInput.trim()}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px", background: "linear-gradient(135deg,#6c63ff,#a855f7)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: lookingUp ? "not-allowed" : "pointer", opacity: lookingUp || !emailInput.trim() ? 0.6 : 1 }}>
                {lookingUp ? "Looking up account…" : "→ Continue"}
              </button>
            </form>
            <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#475569" }}>
              Not banned? <a href="/" style={{ color: "#6c63ff" }}>Try logging in again</a>
            </p>
          </div>
        )}

        {/* Appeal form — shown after identity is confirmed */}
        {!loading && userData && !existing && !submitted && (
          <div style={{ background: "#161b24", border: "1px solid #ffffff12", borderRadius: 14, padding: "24px 24px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Send a Message to Admin</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 18, lineHeight: 1.6 }}>
              Explain your situation clearly. The admin will read this message and decide whether to restore your account.
            </p>
            <form onSubmit={handleSubmit}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Example: I was traveling for work and logged in from Germany. I am the legitimate owner of this account. My normal location is India. Please review my login history..."
                rows={6}
                style={{ width: "100%", padding: "12px 14px", background: "#1c2130", border: "1px solid #ffffff15", borderRadius: 10, color: "#e2e8f0", fontSize: 13, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit" }}
              />
              {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{error}</p>}
              <button type="submit" disabled={sending || !message.trim()}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 14, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#a855f7)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", opacity: sending || !message.trim() ? 0.6 : 1 }}>
                <Send size={15} /> {sending ? "Sending to admin…" : "Send Message to Admin"}
              </button>
            </form>
          </div>
        )}

        {/* Success */}
        {submitted && (
          <div style={{ background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.25)", borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
            <CheckCircle size={36} color="#10b981" style={{ marginBottom: 12 }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>Appeal Submitted</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
              Your appeal is under review by the security team. You will be notified once a decision has been made. This usually takes a few hours.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, fontSize: 12, color: "#64748b" }}>
              <Clock size={13} /> Estimated review time: 2–24 hours
            </div>
          </div>
        )}


        <p style={{ textAlign: "center", fontSize: 11, color: "#334155", marginTop: 24 }}>
          SecureVault Security System · Account appeals are reviewed by administrators
        </p>
      </div>
    </div>
  );
}
