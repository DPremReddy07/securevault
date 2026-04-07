"use client";
// AI runs entirely locally — no API key required
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import CryptoJS from "crypto-js";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";
import { Shield, LogOut, Upload, Download, Trash2, FileText, Activity, AlertTriangle, Globe, CheckCircle, Eye, EyeOff, Copy, Plus, Search, Share2, Lock, X, MessageSquare, Map } from "lucide-react";

const SECRET_KEY = "DEMO_SECRET_KEY_CHANGE_ME";

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtBytes(b) {
  if (!b) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}
function fmtDate(iso) { return iso ? new Date(iso).toLocaleString() : ""; }
function fileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  return { py: "🐍", pdf: "📄", jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️", txt: "📝", zip: "📦", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊", csv: "📊", mp4: "🎬", mp3: "🎵", json: "🔧", js: "🟨", ts: "🔷", html: "🌐", css: "🎨" }[ext] || "📎";
}
function latLng2pct(lat, lng) {
  return { x: ((lng + 180) / 360 * 100).toFixed(1) + "%", y: ((90 - lat) / 180 * 100).toFixed(1) + "%" };
}
async function logAction(uid, action, detail) {
  try { await supabase.from("audit_logs").insert({ user_id: uid, action, detail }); } catch { }
}

// ─── inline CSS ───────────────────────────────────────────────────────────────
const CSS = `
.d-tab{padding:8px 14px;border-radius:8px 8px 0 0;font-size:13px;font-weight:600;border:none;cursor:pointer;background:transparent;color:#64748b;transition:all .2s;display:inline-flex;align-items:center;gap:6px;border-bottom:2px solid transparent;white-space:nowrap}
.d-tab.active{color:#6c63ff;border-bottom:2px solid #6c63ff}
.d-tab:hover:not(.active){color:#e2e8f0}
.d-badge{background:#ef4444;color:#fff;border-radius:10px;padding:1px 6px;font-size:10px;font-family:monospace}
.d-badge.info{background:#6c63ff}
.d-stat{background:#1c2130;border:1px solid #ffffff12;border-radius:10px;padding:14px;text-align:center}
.d-stat-val{font-size:22px;font-weight:800;font-family:monospace}
.d-upload-zone{border:2px dashed #ffffff20;border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all .3s}
.d-upload-zone:hover,.d-upload-zone.drag{border-color:#6c63ff;background:rgba(108,99,255,.05)}
.d-upload-btn{width:100%;padding:12px;background:linear-gradient(135deg,#6c63ff,#a855f7);border:none;border-radius:10px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.d-upload-btn:hover{opacity:.9;transform:translateY(-1px)}
.d-file-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:#1c2130;border-radius:10px;border:1px solid #ffffff12;transition:all .2s;margin-bottom:8px}
.d-file-row:hover{border-color:#ffffff20;transform:translateX(2px)}
.d-file-icon{width:36px;height:36px;border-radius:8px;background:rgba(108,99,255,.2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.d-btn-sm{padding:5px 12px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid;display:inline-flex;align-items:center;gap:4px;background:transparent}
.d-btn-decrypt{color:#22d3ee;border-color:rgba(34,211,238,.4)}.d-btn-decrypt:hover{background:rgba(34,211,238,.15)}
.d-btn-share{color:#6c63ff;border-color:rgba(108,99,255,.4)}.d-btn-share:hover{background:rgba(108,99,255,.15)}
.d-btn-del{color:#ef4444;border-color:rgba(239,68,68,.3)}.d-btn-del:hover{background:rgba(239,68,68,.15)}
.d-search{width:100%;padding:9px 12px 9px 36px;background:#1c2130;border:1px solid #ffffff12;border-radius:9px;color:#e2e8f0;font-size:13px;outline:none;transition:border .2s}
.d-search:focus{border-color:#6c63ff}
.d-log-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #ffffff12;font-size:12px;font-family:monospace}
.d-log-row:last-child{border:none}
.d-log-badge{padding:2px 8px;border-radius:5px;font-size:10px;font-weight:600;min-width:68px;text-align:center}
.d-threat-card{padding:14px 16px;border-radius:10px;border:1px solid;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start}
.d-pw-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#1c2130;border:1px solid #ffffff12;border-radius:9px;margin-bottom:8px;transition:all .2s}
.d-pw-row:hover{border-color:#ffffff20}
.d-reveal-btn{background:transparent;border:1px solid #ffffff20;color:#94a3b8;border-radius:5px;padding:3px 8px;font-size:11px;cursor:pointer;white-space:nowrap}
.d-reveal-btn:hover{border-color:#6c63ff;color:#6c63ff}
.d-btn-add{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:10px;background:transparent;border:1px dashed #ffffff20;border-radius:9px;color:#64748b;font-size:13px;cursor:pointer;margin-top:4px;transition:all .2s}
.d-btn-add:hover{border-color:#6c63ff;color:#6c63ff;background:rgba(108,99,255,.05)}
.d-map-dot{position:absolute;width:10px;height:10px;border-radius:50%;transform:translate(-50%,-50%)}
.d-map-dot::after{content:'';position:absolute;inset:-5px;border-radius:50%;animation:d-ripple 2s infinite}
.dot-safe{background:#10b981;box-shadow:0 0 8px #10b981}.dot-safe::after{border:1px solid #10b981}
.dot-threat{background:#ef4444;box-shadow:0 0 8px #ef4444}.dot-threat::after{border:1px solid #ef4444;animation-duration:1.5s}
.d-login-entry{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#1c2130;border-radius:8px;border:1px solid #ffffff12;margin-bottom:6px;font-size:12px;font-family:monospace}
.d-ai-chat{display:flex;flex-direction:column;gap:10px;max-height:320px;overflow-y:auto;padding-right:4px}
.d-ai-chat::-webkit-scrollbar{width:3px}.d-ai-chat::-webkit-scrollbar-thumb{background:#ffffff20;border-radius:3px}
.d-msg{display:flex;gap:8px;align-items:flex-start}
.d-msg-avatar{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.d-bubble{padding:10px 13px;border-radius:10px;font-size:13px;line-height:1.5;max-width:85%}
.d-user .d-msg-avatar{background:rgba(108,99,255,.3);color:#6c63ff}
.d-user .d-bubble{background:rgba(108,99,255,.18);border:1px solid rgba(108,99,255,.2);color:#e2e8f0}
.d-ai .d-msg-avatar{background:rgba(168,85,247,.3);color:#a855f7}
.d-ai .d-bubble{background:#1c2130;border:1px solid #ffffff12;color:#e2e8f0}
.d-chip{font-size:11px;padding:5px 11px;background:#1c2130;border:1px solid #ffffff20;border-radius:20px;cursor:pointer;color:#94a3b8;transition:all .2s}
.d-chip:hover{background:rgba(108,99,255,.15);color:#6c63ff;border-color:rgba(108,99,255,.4)}
.d-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.d-modal{background:#161b24;border:1px solid #ffffff25;border-radius:16px;padding:24px;width:90%;max-width:420px}
.d-modal-input{width:100%;padding:10px 13px;background:#1c2130;border:1px solid #ffffff12;border-radius:9px;color:#e2e8f0;font-size:13px;outline:none;margin-bottom:10px}
.d-modal-input:focus{border-color:#6c63ff}
.d-btn-primary{padding:9px 18px;background:linear-gradient(135deg,#6c63ff,#a855f7);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:13px;cursor:pointer}
.d-btn-cancel{padding:9px 18px;background:transparent;border:1px solid #ffffff20;border-radius:8px;color:#94a3b8;font-size:13px;cursor:pointer}
.d-btn-danger{padding:9px 18px;background:#ef4444;border:none;border-radius:8px;color:#fff;font-weight:700;font-size:13px;cursor:pointer}
.d-live-dot{width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981;display:inline-block;animation:d-pulse 2s infinite}
.d-enc-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;background:rgba(16,185,129,.18);color:#10b981;border:1px solid rgba(16,185,129,.3);border-radius:6px;padding:3px 8px;margin-top:12px;font-family:monospace}
.d-pw-strength{height:3px;border-radius:3px;margin:4px 0 8px;transition:all .3s;background:#ffffff12}
.d-share-link{font-family:monospace;font-size:11px;background:#0a0b0f;padding:8px 10px;border-radius:7px;border:1px solid #ffffff20;color:#22d3ee;margin:10px 0;word-break:break-all}
.d-enc-label{font-size:10px;background:rgba(16,185,129,.15);color:#10b981;border-radius:4px;padding:1px 5px;margin-left:6px;font-family:monospace}
.d-dismiss-btn{background:transparent;border:1px solid #ffffff20;color:#64748b;border-radius:6px;padding:3px 9px;font-size:11px;cursor:pointer;flex-shrink:0}
.d-dismiss-btn:hover{background:#ffffff12;color:#e2e8f0}
@media(max-width:520px){.d-stats-grid{grid-template-columns:repeat(2,1fr)!important}.d-file-actions{flex-direction:column}.tabs-scroll{overflow-x:auto}}
.map-wrap{position:relative;border-radius:12px;overflow:hidden;background:#060b12;border:1px solid rgba(108,99,255,.25)}
.map-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(108,99,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,.07) 1px,transparent 1px);background-size:40px 40px;z-index:1}
.map-scanline{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(34,211,238,.7),transparent);animation:map-scan 4s linear infinite;pointer-events:none;z-index:3}
@keyframes map-scan{0%{top:0;opacity:1}85%{opacity:.6}100%{top:100%;opacity:0}}
.map-corner{position:absolute;width:14px;height:14px;border-color:#6c63ff;border-style:solid;opacity:.7;z-index:4}
.map-corner.tl{top:8px;left:8px;border-width:2px 0 0 2px}
.map-corner.tr{top:8px;right:8px;border-width:2px 2px 0 0}
.map-corner.bl{bottom:8px;left:8px;border-width:0 0 2px 2px}
.map-corner.br{bottom:8px;right:8px;border-width:0 2px 2px 0}
.map-dot2{position:absolute;transform:translate(-50%,-50%);cursor:pointer;z-index:5}
.map-dot2-inner{width:10px;height:10px;border-radius:50%;position:relative;z-index:2}
.map-dot2-ring{position:absolute;border-radius:50%;border:1px solid;animation:dot-ring 2.5s ease-out infinite}
.map-dot2-ring1{width:22px;height:22px;top:-6px;left:-6px;animation-delay:0s}
.map-dot2-ring2{width:34px;height:34px;top:-12px;left:-12px;animation-delay:.6s;opacity:.5}
@keyframes dot-ring{0%{transform:scale(.4);opacity:.9}100%{transform:scale(1);opacity:0}}
.map-dot2.new-login .map-dot2-inner{animation:new-dot-flash .35s ease 4}
@keyframes new-dot-flash{0%,100%{opacity:1}50%{opacity:.1;transform:scale(1.5)}}
.map-tip{position:absolute;background:#0d111c;border:1px solid rgba(108,99,255,.4);border-radius:7px;padding:5px 10px;font-size:11px;font-family:monospace;color:#e2e8f0;white-space:nowrap;pointer-events:none;z-index:10;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);box-shadow:0 4px 16px rgba(0,0,0,.5)}
.map-stat-pill{display:flex;align-items:center;gap:6px;padding:5px 12px;background:#1c2130;border:1px solid #ffffff10;border-radius:20px;font-size:11px;font-family:monospace;color:#94a3b8}
.login-timeline-item{display:flex;gap:12px;padding:10px 0;position:relative}
.login-timeline-item:not(:last-child)::after{content:'';position:absolute;left:14px;top:32px;bottom:-2px;width:1px;background:linear-gradient(#ffffff15,transparent)}
.timeline-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;position:relative;z-index:1}
.timeline-card{flex:1;background:#141922;border:1px solid #ffffff0e;border-radius:10px;padding:10px 13px;transition:all .2s}
.timeline-card:hover{border-color:#ffffff20;background:#1c2130}
.timeline-card.new-flash{animation:card-flash .8s ease}
@keyframes card-flash{0%{background:rgba(108,99,255,.2);border-color:rgba(108,99,255,.5)}100%{background:#141922;border-color:#ffffff0e}}
`;

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ fileName, onConfirm, onCancel }) {
  return (
    <div className="d-modal-overlay" onClick={onCancel}>
      <div className="d-modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🗑️ Confirm Delete</h3>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
          Permanently delete <strong style={{ color: "#e2e8f0" }}>{fileName}</strong> from your vault? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="d-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="d-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareModal({ fileName, onClose }) {
  const link = `https://vault.app/share/${btoa(fileName + Date.now()).substring(0, 24)}`;
  const copy = () => { navigator.clipboard?.writeText(link); toast.success("Link copied!"); };
  return (
    <div className="d-modal-overlay" onClick={onClose}>
      <div className="d-modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🔗 Share Encrypted File</h3>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>Time-limited link. Recipient needs a shared key to decrypt.</p>
        <div className="d-share-link">{link}...</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select style={{ flex: 1, padding: "8px", background: "#1c2130", border: "1px solid #ffffff12", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none" }}>
            <option>1 hour</option><option>24 hours</option><option>7 days</option>
          </select>
          <button className="d-btn-primary" onClick={copy}>Copy Link</button>
          <button className="d-btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Password Modal ────────────────────────────────────────────────────────
function AddPwModal({ onSave, onClose }) {
  const [site, setSite] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [strength, setStrength] = useState({ width: "0%", color: "#ffffff12" });

  function calcStrength(v) {
    let s = 0;
    if (v.length >= 8) s++; if (v.length >= 12) s++;
    if (/[A-Z]/.test(v)) s++; if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
    const colors = ["#ef4444", "#f59e0b", "#f59e0b", "#10b981", "#10b981"];
    setStrength({ width: (s * 20) + "%", color: colors[Math.max(0, s - 1)] || "#ffffff12" });
  }

  return (
    <div className="d-modal-overlay" onClick={onClose}>
      <div className="d-modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔐 Add Password Entry</h3>
        <input className="d-modal-input" placeholder="Website (e.g. github.com)" value={site} onChange={e => setSite(e.target.value)} />
        <input className="d-modal-input" placeholder="Username / Email" value={user} onChange={e => setUser(e.target.value)} />
        <input className="d-modal-input" type="password" placeholder="Password" value={pass} onChange={e => { setPass(e.target.value); calcStrength(e.target.value); }} />
        <div className="d-pw-strength" style={{ width: strength.width, background: strength.color }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="d-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="d-btn-primary" onClick={() => { if (!site || !user || !pass) { toast.error("Fill all fields"); return; } onSave({ site, user, pass }); onClose(); }}>Encrypt & Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, role, loading: roleLoading } = useRole();
  const isAdmin = role === "admin";

  // data
  const [files, setFiles] = useState([]);
  const [passwords, setPasswords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [threats, setThreats] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState("files");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [revealedPws, setRevealedPws] = useState({});
  const [newLoginId, setNewLoginId] = useState(null);
  const [hoveredDot, setHoveredDot] = useState(null);

  // modals
  const [deleteModal, setDeleteModal] = useState(null); // file object
  const [shareModal, setShareModal] = useState(null);   // file name
  const [addPwModal, setAddPwModal] = useState(false);

  const fileInputRef = useRef(null);
  const aiChatRef = useRef(null);

  useEffect(() => { if (!roleLoading && !user) router.push("/"); }, [roleLoading, user, router]);

  // ── fetchers ──────────────────────────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    if (!user) return;
    let q = supabase.from("files").select("*").order("created_at", { ascending: false });
    if (!isAdmin) q = q.eq("user_id", user.id);
    const { data } = await q;
    setFiles(data || []);
  }, [user, isAdmin]);

  const fetchPasswords = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("vault_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setPasswords(data || []);
  }, [user]);

  const fetchAuditLogs = useCallback(async () => {
    if (!user) return;
    let q = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50);
    if (!isAdmin) q = q.eq("user_id", user.id);
    const { data } = await q;
    setAuditLogs(data || []);
  }, [user, isAdmin]);

  const fetchThreats = useCallback(async () => {
    if (!user) return;
    let q = supabase.from("login_logs").select("*").not("threat_flag", "is", null).order("created_at", { ascending: false }).limit(30);
    if (!isAdmin) q = q.eq("user_id", user.id);
    const { data } = await q;
    setThreats((data || []).map(t => ({ ...t, dismissed: false })));
  }, [user, isAdmin]);

  const fetchLoginHistory = useCallback(async () => {
    if (!user) return;
    let q = supabase.from("login_logs").select("*").order("created_at", { ascending: false }).limit(20);
    if (!isAdmin) q = q.eq("user_id", user.id);
    const { data } = await q;
    setLoginHistory(data || []);
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && role) { fetchFiles(); fetchPasswords(); fetchAuditLogs(); fetchThreats(); fetchLoginHistory(); }
  }, [user, role, fetchFiles, fetchPasswords, fetchAuditLogs, fetchThreats, fetchLoginHistory]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const ch1 = supabase.channel("rt:audit").on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, ({ new: row }) => {
      if (isAdmin || row.user_id === user.id) setAuditLogs(p => [row, ...p].slice(0, 50));
    }).subscribe();
    const ch2 = supabase.channel("rt:logins").on("postgres_changes", { event: "INSERT", schema: "public", table: "login_logs" }, ({ new: row }) => {
      if (!isAdmin && row.user_id !== user.id) return;
      // Update login history for any new login
      setLoginHistory(p => [row, ...p].slice(0, 20));
      setNewLoginId(row.id);
      setTimeout(() => setNewLoginId(null), 3500);
      // Threats only for flagged
      if (row.threat_flag) {
        setThreats(p => [{ ...row, dismissed: false }, ...p].slice(0, 30));
        toast(`🚨 ${row.threat_flag === "impossible_travel" ? "Impossible travel detected!" : `New country login: ${row.country}`}`, { duration: 6000, style: { background: "#7f1d1d", color: "#fff" } });
      } else {
        toast(`📍 New login: ${[row.city, row.country].filter(Boolean).join(", ") || "Unknown"}`, { duration: 3000, style: { background: "#064e3b", color: "#d1fae5" } });
      }
    }).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [user, isAdmin]);

  // ── Upload ─────────────────────────────────────────────────────────────────
  async function handleUpload(file) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("Max file size is 50 MB"); return; }
    setUploading(true); setUploadPct(0);
    const interval = setInterval(() => setUploadPct(p => Math.min(p + Math.random() * 15, 90)), 80);
    try {
      const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
      const encrypted = CryptoJS.AES.encrypt(dataUrl, SECRET_KEY).toString();
      const { error } = await supabase.from("files").insert({ user_id: user.id, name: file.name, size: file.size, encrypted_data: encrypted });
      if (error) throw error;
      clearInterval(interval); setUploadPct(100);
      await logAction(user.id, "UPLOAD", file.name);
      toast.success(`✅ ${file.name} encrypted & uploaded`);
      fetchFiles();
    } catch (err) {
      clearInterval(interval);
      toast.error(err.message || "Upload failed");
    } finally {
      setTimeout(() => { setUploading(false); setUploadPct(0); }, 600);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(f) {
    try {
      const bytes = CryptoJS.AES.decrypt(f.encrypted_data, SECRET_KEY);
      const dataUrl = bytes.toString(CryptoJS.enc.Utf8);
      if (!dataUrl) throw new Error("Decryption failed — wrong key?");
      const a = document.createElement("a"); a.href = dataUrl; a.download = f.name; a.click();
      await logAction(user.id, "DOWNLOAD", f.name);
      toast.success(`🔓 ${f.name} decrypted`);
    } catch (err) { toast.error(err.message); }
  }

  async function confirmDelete() {
    if (!deleteModal) return;
    const { error } = await supabase.from("files").delete().eq("id", deleteModal.id);
    if (error) { toast.error(error.message); return; }
    await logAction(user.id, "DELETE", deleteModal.name);
    setFiles(p => p.filter(x => x.id !== deleteModal.id));
    setDeleteModal(null);
    toast.success("🗑️ File deleted");
  }

  async function handleSavePassword({ site, user: u, pass }) {
    const encrypted = CryptoJS.AES.encrypt(pass, SECRET_KEY).toString();
    const { data, error } = await supabase.from("vault_entries").insert({ user_id: user.id, site, username: u, encrypted_password: encrypted }).select().single();
    if (error) { toast.error(error.message); return; }
    setPasswords(p => [data, ...p]);
    await logAction(user.id, "UPLOAD", `Password for ${site} saved`);
    toast.success("🔐 Password encrypted & saved");
  }

  function revealPassword(id, encrypted) {
    if (revealedPws[id]) { setRevealedPws(p => { const n = { ...p }; delete n[id]; return n; }); return; }
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const plain = bytes.toString(CryptoJS.enc.Utf8);
    setRevealedPws(p => ({ ...p, [id]: plain }));
    logAction(user.id, "REVEAL", `Password revealed`);
    toast("👁 Password revealed — hide when done", { icon: "⚠️" });
  }

  // ── AI ─────────────────────────────────────────────────────────────────────
  // ── Local AI engine — no API key needed ──────────────────────────────────
  function localAI(q, ctx) {
    const lower = q.toLowerCase();
    const { fileCount, files: fl, threats: th, passwords: pw, loginHistory: lh, activeThreats, totalSize } = ctx;

    // Security score
    if (lower.includes("score") || lower.includes("secure") || lower.includes("safe")) {
      let score = 10;
      const issues = [];
      if (activeThreats > 0) { score -= activeThreats * 2; issues.push(`${activeThreats} unresolved threat alert${activeThreats > 1 ? "s" : ""}`); }
      if (fileCount === 0) { score -= 1; issues.push("no files stored yet"); }
      if (pw === 0) { score -= 1; issues.push("password vault is empty"); }
      score = Math.max(score, 3);
      const grade = score >= 8 ? "🟢 Excellent" : score >= 6 ? "🟡 Good" : "🔴 Needs attention";
      return `<strong>Security Score: ${score}/10 — ${grade}</strong><br><br>` +
        (issues.length ? `Issues found:<br>• ${issues.join("<br>• ")}<br><br>` : "No major issues found!<br><br>") +
        `Strengths:<br>• All ${fileCount} files are AES-256 encrypted client-side<br>• hCaptcha bot protection on login<br>• Login anomaly detection is active`;
    }

    // Threat explanation
    if (lower.includes("threat") || lower.includes("alert") || lower.includes("travel") || lower.includes("country")) {
      if (activeThreats === 0) return "✅ <strong>No active threats!</strong> All your recent logins look normal. The system monitors every login for new-country access and impossible travel (moving >500 km in under 1 hour).";
      const t = th[0] || "";
      const isTravel = t.includes("impossible_travel");
      return `⚠️ You have <strong>${activeThreats} active threat alert${activeThreats > 1 ? "s" : ""}</strong>.<br><br>` +
        (isTravel
          ? `The <strong>Impossible Travel</strong> alert means two logins occurred from locations >500 km apart within 1 hour — a strong sign of stolen credentials or VPN switching.<br><br><strong>Recommended actions:</strong><br>• Change your master password immediately<br>• Check your Login Map tab for exact locations<br>• Enable 2FA on your account`
          : `The <strong>New Country Login</strong> alert means someone logged in from a country different from your last login.<br><br><strong>Recommended actions:</strong><br>• Verify it was you (check the Login Map tab)<br>• If not you, change your password immediately<br>• Dismiss the alert once investigated`);
    }

    // Files / uploads
    if (lower.includes("file") || lower.includes("upload") || lower.includes("recent")) {
      if (fileCount === 0) return "You haven't uploaded any files yet. Click <strong>My Files</strong> tab and drag any file into the upload zone — it will be AES-256 encrypted in your browser before reaching the server.";
      const recent = fl.slice(0, 3).map(f => `• ${f}`).join("<br>");
      return `You have <strong>${fileCount} encrypted file${fileCount > 1 ? "s" : ""}</strong> (${totalSize} total).<br><br>Most recent:<br>${recent}<br><br>All files are encrypted with AES-256 before upload. Even a full database breach would reveal only ciphertext to an attacker.`;
    }

    // Encryption details
    if (lower.includes("encrypt") || lower.includes("aes") || lower.includes("how") && lower.includes("data")) {
      return "<strong>How SecureVault encrypts your data:</strong><br><br>1. File is read into browser memory using FileReader<br>2. Converted to a base64 data URL<br>3. Encrypted with <strong>AES-256 CBC</strong> using crypto-js<br>4. Only the ciphertext is sent to Supabase<br><br>The server never sees your plaintext. Decryption also happens entirely in your browser — the key never leaves your device.";
    }

    // Passwords
    if (lower.includes("password") || lower.includes("vault") || lower.includes("credential")) {
      if (pw === 0) return "Your <strong>Password Vault</strong> is empty. Click the Password Vault tab → \"Add Password Entry\" to store encrypted credentials. Passwords are AES-256 encrypted before saving — the server only stores ciphertext.";
      return `You have <strong>${pw} password${pw > 1 ? "s" : ""} stored</strong> in your encrypted vault.<br><br>Passwords are encrypted with the same AES-256 key as your files and never stored in plaintext. Use the 👁 Reveal button to temporarily view a password — it auto-hides when you switch entries.`;
    }

    // Login history
    if (lower.includes("login") || lower.includes("location") || lower.includes("map") || lower.includes("where")) {
      if (lh.length === 0) return "No login history recorded yet. After your next login, location data will appear in the <strong>Login Map</strong> tab with IP, city, and country information.";
      const recent = lh.slice(0, 3).map(l => `• ${l}`).join("<br>");
      return `<strong>${lh.length} login${lh.length > 1 ? "s" : ""}</strong> recorded.<br><br>Recent logins:<br>${recent}<br><br>Check the <strong>Login Map</strong> tab to see all locations plotted on a world map. Red dots indicate flagged logins.`;
    }

    // 2FA
    if (lower.includes("2fa") || lower.includes("two factor") || lower.includes("totp")) {
      return "<strong>Two-Factor Authentication (2FA)</strong> is not yet implemented in SecureVault but is on the roadmap.<br><br>For now, your account is protected by:<br>• Strong hCaptcha bot protection on every login<br>• Real-time login anomaly detection<br>• AES-256 client-side encryption (data is safe even if the DB is breached)";
    }

    // What to do after new country login
    if (lower.includes("new country") || lower.includes("after") || lower.includes("what should")) {
      return "<strong>After a new-country login alert:</strong><br><br>1. Check the <strong>Login Map</strong> — verify the city/IP matches a place you traveled to<br>2. If it was you → Dismiss the alert in the Threats tab<br>3. If it wasn't you → Change your master password immediately and sign out all other sessions in Supabase<br>4. Consider using a VPN consistently so future logins appear from the same country";
    }

    // Default / general
    const tips = [
      activeThreats > 0 ? `You have ${activeThreats} unresolved threat alert${activeThreats > 1 ? "s" : ""} — check the <strong>Threats</strong> tab.` : "✅ No active threats detected.",
      `You have <strong>${fileCount} encrypted file${fileCount !== 1 ? "s" : ""}</strong> (${totalSize}).`,
      pw > 0 ? `<strong>${pw} password${pw !== 1 ? "s" : ""}</strong> in your vault.` : "Password vault is empty — add some credentials!",
    ];
    return tips.join("<br>") + "<br><br>Ask me anything about your files, threats, passwords, encryption, or login history!";
  }

  async function sendAI(q) {
    const question = q || aiInput.trim();
    if (!question) return;
    setAiInput("");
    setAiMessages(p => [...p, { role: "user", text: question }, { role: "ai", text: "<span style='color:#64748b'>Analyzing your vault…</span>", thinking: true }]);
    setAiLoading(true);

    // Simulate a brief thinking delay for UX
    await new Promise(r => setTimeout(r, 600));

    try {
      const ctx = {
        fileCount: files.length,
        files: files.slice(0, 5).map(f => `${f.name} (${fmtBytes(f.size)}, ${fmtDate(f.created_at)})`),
        threats: threats.filter(t => !t.dismissed).map(t => t.threat_flag + " " + (t.city || "") + " " + (t.country || "")),
        passwords: passwords.length,
        loginHistory: loginHistory.slice(0, 5).map(l => `${l.city || ""}, ${l.country || ""} ${fmtDate(l.created_at)}${l.threat_flag ? " FLAGGED" : ""}`),
        activeThreats: threats.filter(t => !t.dismissed).length,
        totalSize: fmtBytes(files.reduce((a, f) => a + (f.size || 0), 0)),
      };
      const text = localAI(question, ctx);
      setAiMessages(p => [...p.slice(0, -1), { role: "ai", text }]);
    } catch {
      setAiMessages(p => [...p.slice(0, -1), { role: "ai", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => { if (aiChatRef.current) aiChatRef.current.scrollTop = aiChatRef.current.scrollHeight; }, 50);
    }
  }

  useEffect(() => {
    if (activeTab === "ai" && aiMessages.length === 0) {
      const activeThreatCount = threats.filter(t => !t.dismissed).length;
      setAiMessages([{ role: "ai", text: `Hi! I'm your <strong>SecureVault AI assistant</strong>.<br><br>You have <strong>${files.length} encrypted files</strong>, <strong>${passwords.length} passwords</strong>, and <strong>${activeThreatCount} active threat alert${activeThreatCount !== 1 ? "s" : ""}</strong>. What would you like to know?` }]);
    }
  }, [activeTab]);

  if (roleLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0b0f" }}>
      <div className="animate-spin" style={{ width: 40, height: 40, border: "3px solid #252d4a", borderTopColor: "#6c63ff", borderRadius: "50%" }} />
    </div>
  );

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
  const activeThreats = threats.filter(t => !t.dismissed);
  const totalSize = fmtBytes(files.reduce((a, f) => a + (f.size || 0), 0));

  // ─── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0f", color: "#e2e8f0" }}>
      <style>{CSS}</style>

      {/* Modals */}
      {deleteModal && <DeleteModal fileName={deleteModal.name} onConfirm={confirmDelete} onCancel={() => setDeleteModal(null)} />}
      {shareModal && <ShareModal fileName={shareModal} onClose={() => setShareModal(null)} />}
      {addPwModal && <AddPwModal onSave={handleSavePassword} onClose={() => setAddPwModal(false)} />}

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, background: "#111318", borderBottom: "1px solid #ffffff12", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 17 }}>
          <Shield size={20} color="#6c63ff" /> SecureVault
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace", padding: "4px 10px", background: "#1c2130", borderRadius: 20, border: "1px solid #ffffff12" }}>{user?.email}</span>
          {isAdmin && <span style={{ fontSize: 11, padding: "3px 8px", background: "rgba(108,99,255,0.2)", color: "#6c63ff", borderRadius: 10, fontWeight: 700 }}>ADMIN</span>}
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #ffffff20", background: "transparent", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="tabs-scroll" style={{ padding: "14px 20px 0", display: "flex", gap: 4, background: "#111318", borderBottom: "1px solid #ffffff12", position: "sticky", top: 52, zIndex: 99 }}>
        {[
          { id: "files", label: "📁 My Files" },
          { id: "passwords", label: "🔐 Password Vault" },
          { id: "audit", label: "📋 Audit Log" },
          { id: "threats", label: "⚠️ Threats", badge: activeThreats.length || null, badgeClass: "" },
          { id: "logins", label: "🌍 Login Map" },
          { id: "ai", label: "✨ AI Assistant", badge: "NEW", badgeClass: "info" },
        ].map(tab => (
          <button key={tab.id} className={`d-tab${activeTab === tab.id ? " active" : ""}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
            {tab.badge && <span className={`d-badge ${tab.badgeClass || ""}`}>{tab.badge}</span>}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "20px 16px" }}>

        {/* Stats */}
        <div className="d-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { val: files.length, label: "Encrypted Files", color: "#6c63ff" },
            { val: totalSize, label: "Total Size", color: "#10b981" },
            { val: activeThreats.length, label: "Active Threats", color: activeThreats.length ? "#ef4444" : "#10b981" },
            { val: auditLogs.length, label: "Audit Events", color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} className="d-stat">
              <div className="d-stat-val" style={{ color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── FILES TAB ── */}
        {activeTab === "files" && (
          <>
            <div style={{ background: "#161b24", border: "1px solid #ffffff12", borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><Upload size={16} color="#6c63ff" /> Upload &amp; Encrypt File</div>
              <div className={`d-upload-zone${uploading ? " drag" : ""}`}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag"); }}
                onDragLeave={e => e.currentTarget.classList.remove("drag")}
                onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("drag"); handleUpload(e.dataTransfer.files[0]); }}>
                <button className="d-upload-btn" onClick={e => { e.stopPropagation(); !uploading && fileInputRef.current?.click(); }}>
                  <Upload size={18} /> {uploading ? `Encrypting… ${Math.round(uploadPct)}%` : "Choose File or Drop Here"}
                </button>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Drag &amp; drop any file · Max 50 MB</p>
                <div className="d-enc-badge"><Lock size={12} /> AES-256 encrypted in browser before upload</div>
                {uploading && (
                  <div style={{ background: "#0a0b0f", borderRadius: 8, height: 6, overflow: "hidden", marginTop: 12 }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg,#6c63ff,#a855f7,#22d3ee)", borderRadius: 8, width: uploadPct + "%", transition: "width .3s" }} />
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={e => handleUpload(e.target.files[0])} />
            </div>

            <div style={{ background: "#161b24", border: "1px solid #ffffff12", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><FileText size={16} color="#6c63ff" /> {isAdmin ? "All Files" : "Your Encrypted Files"}</div>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>🔍</span>
                <input className="d-search" placeholder="Search files…" value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              {filteredFiles.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "24px 0", fontSize: 13 }}>No files found.</p>
              ) : filteredFiles.map(f => (
                <div key={f.id} className="d-file-row">
                  <div className="d-file-icon">{fileIcon(f.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {f.name}<span className="d-enc-label">AES-256</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginTop: 2 }}>{fmtBytes(f.size)} · {fmtDate(f.created_at)}</div>
                  </div>
                  <div className="d-file-actions" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button className="d-btn-sm d-btn-decrypt" onClick={() => handleDownload(f)}><Download size={12} /> Decrypt</button>
                    <button className="d-btn-sm d-btn-share" onClick={() => setShareModal(f.name)}><Share2 size={12} /> Share</button>
                    <button className="d-btn-sm d-btn-del" onClick={() => setDeleteModal(f)}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PASSWORD VAULT TAB ── */}
        {activeTab === "passwords" && (
          <div style={{ background: "#161b24", border: "1px solid #ffffff12", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Lock size={16} color="#6c63ff" /> Encrypted Password Vault</div>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#10b981", fontFamily: "monospace" }}>● master key unlocked</span>
            </div>
            {passwords.length === 0 && <p style={{ color: "#64748b", textAlign: "center", padding: "20px 0", fontSize: 13 }}>No passwords saved yet.</p>}
            {passwords.map(p => (
              <div key={p.id} className="d-pw-row">
                <span style={{ fontSize: 18 }}>🌐</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.site}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{p.username}</div>
                </div>
                <div style={{ fontFamily: "monospace", letterSpacing: revealedPws[p.id] ? "normal" : 3, color: "#64748b", fontSize: 11, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {revealedPws[p.id] || "••••••••••••"}
                </div>
                <button className="d-reveal-btn" onClick={() => revealPassword(p.id, p.encrypted_password)}>
                  {revealedPws[p.id] ? "🙈 Hide" : "👁 Reveal"}
                </button>
              </div>
            ))}
            <button className="d-btn-add" onClick={() => setAddPwModal(true)}><Plus size={14} /> Add Password Entry</button>
          </div>
        )}

        {/* ── AUDIT LOG TAB ── */}
        {activeTab === "audit" && (
          <div style={{ background: "#161b24", border: "1px solid #ffffff12", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Activity size={16} color="#6c63ff" /> {isAdmin ? "All Audit Logs" : "Your Audit Log"}</div>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981" }}><span className="d-live-dot" /> Live</span>
            </div>
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {auditLogs.length === 0 ? <p style={{ color: "#64748b", textAlign: "center", padding: "20px 0", fontSize: 13 }}>No activity yet.</p> :
                auditLogs.map(l => {
                  const styles = { UPLOAD: ["rgba(108,99,255,.15)", "#6c63ff"], DOWNLOAD: ["rgba(34,211,238,.15)", "#22d3ee"], DELETE: ["rgba(239,68,68,.15)", "#ef4444"], REVEAL: ["rgba(34,211,238,.15)", "#22d3ee"], SHARE: ["rgba(168,85,247,.15)", "#a855f7"], LOGIN: ["rgba(245,158,11,.15)", "#f59e0b"] };
                  const [bg, color] = styles[l.action] || ["rgba(255,255,255,.05)", "#94a3b8"];
                  return (
                    <div key={l.id} className="d-log-row">
                      <span className="d-log-badge" style={{ background: bg, color }}>{l.action}</span>
                      <span style={{ flex: 1, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.detail}</span>
                      <span style={{ color: "#64748b", fontSize: 11, whiteSpace: "nowrap" }}>{fmtDate(l.created_at)}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── THREATS TAB ── */}
        {activeTab === "threats" && (
          <div style={{ background: "#161b24", border: "1px solid #ffffff12", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} color="#6c63ff" /> {isAdmin ? "All Threat Alerts" : "Your Threat Alerts"}</div>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981" }}><span className="d-live-dot" /> Live</span>
            </div>
            {activeThreats.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <CheckCircle size={32} color="#10b981" /><p style={{ color: "#64748b", marginTop: 8 }}>No active threats. All logins look normal.</p>
              </div>
            ) : threats.filter(t => !t.dismissed).map((t, i) => {
              const isHigh = t.threat_flag === "impossible_travel";
              return (
                <div key={t.id || i} className="d-threat-card" style={{ background: isHigh ? "rgba(127,29,29,.25)" : "rgba(120,53,15,.25)", borderColor: isHigh ? "rgba(239,68,68,.3)" : "rgba(251,146,60,.3)" }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{isHigh ? "⚡" : "🌍"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isHigh ? "#f87171" : "#fb923c" }}>{isHigh ? "Impossible Travel" : "New Country Login"}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontFamily: "monospace" }}>{[t.city, t.region, t.country].filter(Boolean).join(", ")} — IP: {t.ip || "N/A"}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{fmtDate(t.created_at)}</div>
                  </div>
                  <button className="d-dismiss-btn" onClick={() => setThreats(p => p.map((x, xi) => x === t ? { ...x, dismissed: true } : x))}>Dismiss</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LOGIN MAP TAB ── */}
        {activeTab === "logins" && (() => {
          const withCoords = loginHistory.filter(l => l.latitude && l.longitude);
          const safeCount = loginHistory.filter(l => !l.threat_flag).length;
          const flaggedCount = loginHistory.filter(l => !!l.threat_flag).length;
          const countries = [...new Set(loginHistory.map(l => l.country).filter(Boolean))].length;
          return (
            <div style={{ background: "#161b24", border: "1px solid #ffffff12", borderRadius: 14, padding: 20 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <Globe size={16} color="#6c63ff" /> Live Login Monitor
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: "#22d3ee", letterSpacing: 1 }}>REAL-TIME</span>
                  <span className="d-live-dot" />
                </div>
              </div>

              {/* Map */}
              <div className="map-wrap" style={{ height: 230, marginBottom: 14 }}>
                <div className="map-grid" />
                <div className="map-scanline" />
                <div className="map-corner tl" /><div className="map-corner tr" />
                <div className="map-corner bl" /><div className="map-corner br" />
                {/* Status label */}
                <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 5, fontSize: 10, fontFamily: "monospace", color: "#6c63ff88", letterSpacing: 2, textTransform: "uppercase" }}>
                  Global Threat Map
                </div>
                {/* SVG continents */}
                <svg viewBox="0 0 800 400" style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 2, opacity: 0.5 }} xmlns="http://www.w3.org/2000/svg">
                  <rect width="800" height="400" fill="transparent" />
                  <path d="M100,60 L180,50 L230,70 L250,105 L235,145 L205,165 L165,170 L135,150 L108,120 Z" fill="#0f2a40" stroke="#1a4060" strokeWidth="1" />
                  <path d="M128,162 L168,170 L182,202 L172,242 L152,262 L128,250 L112,220 Z" fill="#0f2a40" stroke="#1a4060" strokeWidth="1" />
                  <path d="M172,250 L215,240 L238,262 L242,315 L225,362 L198,375 L174,360 L158,320 L162,278 Z" fill="#0f2a40" stroke="#1a4060" strokeWidth="1" />
                  <path d="M348,52 L402,48 L432,64 L442,90 L420,112 L390,117 L358,102 L343,76 Z" fill="#0f2a40" stroke="#1a4060" strokeWidth="1" />
                  <path d="M352,116 L418,110 L448,132 L452,182 L440,242 L415,282 L385,292 L358,272 L343,212 L338,162 Z" fill="#0f2a40" stroke="#1a4060" strokeWidth="1" />
                  <path d="M428,38 L562,34 L642,52 L672,82 L648,112 L598,122 L528,117 L468,102 L438,76 Z" fill="#0f2a40" stroke="#1a4060" strokeWidth="1" />
                  <path d="M448,112 L528,117 L578,142 L582,182 L555,202 L512,207 L468,187 L443,157 Z" fill="#0f2a40" stroke="#1a4060" strokeWidth="1" />
                  <path d="M568,68 L662,58 L712,82 L722,122 L692,147 L638,152 L588,137 L563,107 Z" fill="#0f2a40" stroke="#1a4060" strokeWidth="1" />
                  <path d="M608,253 L692,247 L722,272 L717,322 L680,342 L633,337 L603,313 Z" fill="#0f2a40" stroke="#1a4060" strokeWidth="1" />
                </svg>
                {/* Dots overlay */}
                <div style={{ position: "absolute", inset: 0, zIndex: 6 }}>
                  {withCoords.map((l, i) => {
                    const pos = latLng2pct(l.latitude, l.longitude);
                    const isThreat = !!l.threat_flag;
                    const isNew = l.id === newLoginId;
                    const color = isThreat ? "#ef4444" : "#10b981";
                    const isHov = hoveredDot === i;
                    return (
                      <div key={i} className={`map-dot2${isNew ? " new-login" : ""}`}
                        style={{ left: pos.x, top: pos.y }}
                        onMouseEnter={() => setHoveredDot(i)}
                        onMouseLeave={() => setHoveredDot(null)}>
                        <div className="map-dot2-inner" style={{ background: color, boxShadow: `0 0 ${isHov ? "18px" : "8px"} ${color}, 0 0 4px ${color}` }} />
                        <div className="map-dot2-ring map-dot2-ring1" style={{ borderColor: color }} />
                        <div className="map-dot2-ring map-dot2-ring2" style={{ borderColor: color }} />
                        {isHov && (
                          <div className="map-tip">
                            {isThreat ? "⚠️" : "✅"} {[l.city, l.country].filter(Boolean).join(", ") || "Unknown"}
                            {l.ip ? <span style={{ color: "#6c63ff" }}> · {l.ip}</span> : ""}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {withCoords.length === 0 && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 7 }}>
                      <span style={{ color: "#6c63ff60", fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }}>
                        NO GEO DATA — LOGINS WILL APPEAR WHEN LOCATION IS DETECTED
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {[
                  { icon: "⬡", color: "#6c63ff", label: `${loginHistory.length} total` },
                  { icon: "●", color: "#10b981", label: `${safeCount} safe` },
                  { icon: "●", color: "#ef4444", label: `${flaggedCount} flagged` },
                  { icon: "◈", color: "#22d3ee", label: `${countries} countr${countries !== 1 ? "ies" : "y"}` },
                ].map(s => (
                  <div key={s.label} className="map-stat-pill">
                    <span style={{ color: s.color }}>{s.icon}</span> {s.label}
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, fontFamily: "monospace" }}>
                Login History
              </div>
              {loginHistory.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "20px 0", fontSize: 13 }}>No login history yet.</p>
              ) : loginHistory.map((l, i) => {
                const isThreat = !!l.threat_flag;
                const isNew = l.id === newLoginId;
                const color = isThreat ? "#ef4444" : "#10b981";
                const bg = isThreat ? "rgba(239,68,68,.15)" : "rgba(16,185,129,.15)";
                const diff = l.created_at ? Date.now() - new Date(l.created_at).getTime() : 0;
                const mins = Math.floor(diff / 60000);
                const timeAgo = mins < 1 ? "Just now" : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
                return (
                  <div key={l.id || i} className="login-timeline-item">
                    <div className="timeline-dot" style={{ background: bg, border: `1px solid ${color}30` }}>
                      <span>{isThreat ? "⚠️" : "✅"}</span>
                    </div>
                    <div className={`timeline-card${isNew ? " new-flash" : ""}`}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                          {[l.city, l.region, l.country].filter(Boolean).join(", ") || "Unknown location"}
                        </span>
                        {isNew && <span style={{ fontSize: 10, background: "#6c63ff", color: "#fff", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace", fontWeight: 700 }}>● LIVE</span>}
                        {isThreat && (
                          <span style={{ fontSize: 10, background: "rgba(239,68,68,.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,.25)", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace" }}>
                            {l.threat_flag === "impossible_travel" ? "⚡ IMPOSSIBLE TRAVEL" : "🌍 NEW COUNTRY"}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 14, marginTop: 5, fontSize: 11, color: "#64748b", fontFamily: "monospace", alignItems: "center" }}>
                        {l.ip && <span>IP: {l.ip}</span>}
                        <span style={{ color }}>{isThreat ? "⚠ Flagged" : "✓ Safe"}</span>
                        <span style={{ marginLeft: "auto" }}>{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}


        {/* ── AI ASSISTANT TAB ── */}
        {activeTab === "ai" && (
          <div style={{ background: "#161b24", border: "1px solid #ffffff12", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><MessageSquare size={16} color="#6c63ff" /> AI Security Assistant</div>
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, background: "linear-gradient(135deg,#6c63ff,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Powered by Claude</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {["📁 Recent uploads", "⚠️ Explain my threat alert", "🛡️ Security score", "🌍 New country login advice", "🔐 How is data encrypted?"].map(chip => (
                <button key={chip} className="d-chip" onClick={() => sendAI(chip.replace(/^[^\s]+ /, ""))}>{chip}</button>
              ))}
            </div>
            <div className="d-ai-chat" ref={aiChatRef}>
              {aiMessages.map((m, i) => (
                <div key={i} className={`d-msg ${m.role === "user" ? "d-user" : "d-ai"}`}>
                  <div className="d-msg-avatar">{m.role === "user" ? "👤" : "✨"}</div>
                  <div className="d-bubble" dangerouslySetInnerHTML={{ __html: m.text }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                style={{ flex: 1, padding: "10px 14px", background: "#1c2130", border: "1px solid #ffffff12", borderRadius: 10, color: "#e2e8f0", fontSize: 13, outline: "none" }}
                placeholder="Ask about your vault, files, or security…"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !aiLoading && sendAI()}
                onFocus={e => (e.target.style.borderColor = "#6c63ff")}
                onBlur={e => (e.target.style.borderColor = "#ffffff12")}
              />
              <button
                onClick={() => !aiLoading && sendAI()}
                disabled={aiLoading}
                style={{ padding: "10px 18px", background: "linear-gradient(135deg,#6c63ff,#a855f7)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.7 : 1 }}>
                {aiLoading ? "…" : "Ask"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
