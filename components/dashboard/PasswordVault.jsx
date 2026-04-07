// components/dashboard/PasswordVault.jsx
// Displays encrypted passwords with reveal/hide toggle.
// Owns the "Add Password" modal internally.
"use client";

import { useState } from "react";
import { Lock, Plus } from "lucide-react";
import Modal, { ModalActions, ModalInput } from "@/components/ui/Modal";
import toast from "react-hot-toast";

function PasswordStrengthBar({ password }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const color = ["#ef4444", "#f59e0b", "#f59e0b", "#10b981", "#10b981"][Math.max(0, score - 1)] || "#ffffff12";
  return <div style={{ height: 3, borderRadius: 3, margin: "4px 0 8px", background: color, width: (score * 20) + "%", transition: "all .3s" }} />;
}

export default function PasswordVault({ passwords, revealedPws, onSave, onToggleReveal }) {
  const [open, setOpen] = useState(false);
  const [site, setSite] = useState("");
  const [username, setUser] = useState("");
  const [pass, setPass] = useState("");

  function handleSave() {
    if (!site || !username || !pass) { toast.error("Fill all fields"); return; }
    const ok = onSave({ site, username, pass });
    if (ok !== false) {
      setOpen(false); setSite(""); setUser(""); setPass("");
    }
  }

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)} title="🔐 Add Password Entry">
        <ModalInput placeholder="Website (e.g. github.com)" value={site} onChange={e => setSite(e.target.value)} />
        <ModalInput placeholder="Username / Email" value={username} onChange={e => setUser(e.target.value)} />
        <ModalInput placeholder="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} />
        <PasswordStrengthBar password={pass} />
        <ModalActions onCancel={() => setOpen(false)} onConfirm={handleSave} confirmLabel="Encrypt & Save" />
      </Modal>

      <div style={{ background: "#161b24", border: "1px solid #ffffff12", borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={16} color="#6c63ff" /> Encrypted Password Vault
          </div>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#10b981", fontFamily: "monospace" }}>● master key unlocked</span>
        </div>

        {passwords.length === 0 && (
          <p style={{ color: "#64748b", textAlign: "center", padding: "20px 0", fontSize: 13 }}>
            No passwords saved yet.
          </p>
        )}

        {passwords.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#1c2130", border: "1px solid #ffffff12", borderRadius: 9, marginBottom: 8, transition: "all .2s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#ffffff20")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#ffffff12")}>
            <span style={{ fontSize: 18 }}>🌐</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.site}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{p.username}</div>
            </div>
            <div style={{ fontFamily: "monospace", letterSpacing: revealedPws[p.id] ? "normal" : 3, color: "#64748b", fontSize: 11, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {revealedPws[p.id] || "••••••••••••"}
            </div>
            <button
              onClick={() => onToggleReveal(p.id, p.encrypted_password)}
              style={{ background: "transparent", border: "1px solid #ffffff20", color: "#94a3b8", borderRadius: 5, padding: "3px 8px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}
              onMouseEnter={e => { e.target.style.borderColor = "#6c63ff"; e.target.style.color = "#6c63ff"; }}
              onMouseLeave={e => { e.target.style.borderColor = "#ffffff20"; e.target.style.color = "#94a3b8"; }}
            >
              {revealedPws[p.id] ? "🙈 Hide" : "👁 Reveal"}
            </button>
          </div>
        ))}

        <button
          onClick={() => setOpen(true)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: 10, background: "transparent", border: "1px dashed #ffffff20", borderRadius: 9, color: "#64748b", fontSize: 13, cursor: "pointer", marginTop: 4, transition: "all .2s" }}
          onMouseEnter={e => { e.target.style.borderColor = "#6c63ff"; e.target.style.color = "#6c63ff"; }}
          onMouseLeave={e => { e.target.style.borderColor = "#ffffff20"; e.target.style.color = "#64748b"; }}
        >
          <Plus size={14} /> Add Password Entry Ra Beteyy
        </button>
      </div>
    </>
  );
}
