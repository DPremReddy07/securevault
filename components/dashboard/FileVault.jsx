// components/dashboard/FileVault.jsx
// Handles: drag-and-drop upload, progress bar, search, file list, decrypt, share, delete
"use client";

import { useState } from "react";
import { Upload, Download, Trash2, Share2, Lock, FileText } from "lucide-react";
import Modal, { ModalActions } from "@/components/ui/Modal";
import toast from "react-hot-toast";

function fmtBytes(b) {
  if (!b) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}
function fmtDate(iso) { return iso ? new Date(iso).toLocaleString() : ""; }
function fileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  return { py:"🐍", pdf:"📄", jpg:"🖼️", jpeg:"🖼️", png:"🖼️", gif:"🖼️", txt:"📝", zip:"📦", doc:"📝", docx:"📝", xls:"📊", xlsx:"📊", csv:"📊", mp4:"🎬", mp3:"🎵", json:"🔧", js:"🟨", ts:"🔷", html:"🌐", css:"🎨" }[ext] || "📎";
}

export default function FileVault({ files, uploading, uploadPct, fileInputRef, onUpload, onDownload, onDelete }) {
  const [query, setQuery]         = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shareTarget, setShareTarget]   = useState(null);
  const [shareLink]               = useState(() => "");

  const filtered = files.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));

  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag");
    onUpload(e.dataTransfer.files[0]);
  }

  return (
    <>
      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="🗑️ Confirm Delete">
        <p style={{ fontSize:13, color:"#94a3b8", marginBottom:8 }}>
          Permanently delete <strong style={{ color:"#e2e8f0" }}>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <ModalActions
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => { onDelete(deleteTarget); setDeleteTarget(null); }}
          confirmLabel="Delete"
          danger
        />
      </Modal>

      {/* Share modal */}
      <Modal open={!!shareTarget} onClose={() => setShareTarget(null)} title="🔗 Share Encrypted File">
        <p style={{ fontSize:13, color:"#94a3b8" }}>Time-limited link. Recipient needs the shared key to decrypt.</p>
        <div style={{ fontFamily:"monospace", fontSize:11, background:"#0a0b0f", padding:"8px 10px", borderRadius:7, border:"1px solid #ffffff20", color:"#22d3ee", margin:"10px 0", wordBreak:"break-all" }}>
          {`https://vault.app/share/${shareTarget ? btoa(shareTarget.name + Date.now()).substring(0,24) : ""}...`}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <select style={{ flex:1, padding:8, background:"#1c2130", border:"1px solid #ffffff12", borderRadius:8, color:"#e2e8f0", fontSize:13, outline:"none" }}>
            <option>1 hour</option><option>24 hours</option><option>7 days</option>
          </select>
          <button onClick={() => { navigator.clipboard?.writeText("https://vault.app/share/..."); toast.success("Link copied!"); }}
            style={{ padding:"9px 18px", background:"linear-gradient(135deg,#6c63ff,#a855f7)", border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            Copy
          </button>
        </div>
      </Modal>

      {/* Upload card */}
      <div style={{ background:"#161b24", border:"1px solid #ffffff12", borderRadius:14, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          <Upload size={16} color="#6c63ff" /> Upload &amp; Encrypt File
        </div>
        <div
          style={{ border:"2px dashed #ffffff20", borderRadius:12, padding:32, textAlign:"center", cursor:"pointer", transition:"all .3s" }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor="#6c63ff"; e.currentTarget.style.background="rgba(108,99,255,.05)"; }}
          onDragLeave={e => { e.currentTarget.style.borderColor="#ffffff20"; e.currentTarget.style.background="transparent"; }}
          onDrop={handleDrop}
        >
          <button
            style={{ width:"100%", padding:12, background:"linear-gradient(135deg,#6c63ff,#a855f7)", border:"none", borderRadius:10, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
            onClick={e => { e.stopPropagation(); !uploading && fileInputRef.current?.click(); }}
          >
            <Upload size={18} /> {uploading ? `Encrypting… ${Math.round(uploadPct)}%` : "Choose File or Drop Here"}
          </button>
          <p style={{ fontSize:12, color:"#64748b", marginTop:8 }}>Drag &amp; drop any file · Max 50 MB</p>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, background:"rgba(16,185,129,.18)", color:"#10b981", border:"1px solid rgba(16,185,129,.3)", borderRadius:6, padding:"3px 8px", marginTop:12, fontFamily:"monospace" }}>
            <Lock size={12} /> AES-256 encrypted in browser before upload
          </div>
          {uploading && (
            <div style={{ background:"#0a0b0f", borderRadius:8, height:6, overflow:"hidden", marginTop:12 }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg,#6c63ff,#a855f7,#22d3ee)", borderRadius:8, width:uploadPct + "%", transition:"width .3s" }} />
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" style={{ display:"none" }} onChange={e => onUpload(e.target.files[0])} />
      </div>

      {/* File list card */}
      <div style={{ background:"#161b24", border:"1px solid #ffffff12", borderRadius:14, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
            <FileText size={16} color="#6c63ff" /> Your Encrypted Files
          </div>
          <span style={{ marginLeft:"auto", fontSize:11, color:"#64748b", fontFamily:"monospace" }}>
            {filtered.length} file{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Search */}
        <div style={{ position:"relative", marginBottom:14 }}>
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#64748b" }}>🔍</span>
          <input
            style={{ width:"100%", padding:"9px 12px 9px 36px", background:"#1c2130", border:"1px solid #ffffff12", borderRadius:9, color:"#e2e8f0", fontSize:13, outline:"none" }}
            placeholder="Search files…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={e => (e.target.style.borderColor="#6c63ff")}
            onBlur={e => (e.target.style.borderColor="#ffffff12")}
          />
        </div>

        {/* File rows */}
        {filtered.length === 0
          ? <p style={{ color:"#64748b", textAlign:"center", padding:"24px 0", fontSize:13 }}>No files found.</p>
          : filtered.map(f => (
            <div key={f.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#1c2130", borderRadius:10, border:"1px solid #ffffff12", marginBottom:8, transition:"all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="#ffffff20"; e.currentTarget.style.transform="translateX(2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="#ffffff12"; e.currentTarget.style.transform="translateX(0)"; }}>
              <div style={{ width:36, height:36, borderRadius:8, background:"rgba(108,99,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                {fileIcon(f.name)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {f.name}
                  <span style={{ fontSize:10, background:"rgba(16,185,129,.15)", color:"#10b981", borderRadius:4, padding:"1px 5px", marginLeft:6, fontFamily:"monospace" }}>AES-256</span>
                </div>
                <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", marginTop:2 }}>{fmtBytes(f.size)} · {fmtDate(f.created_at)}</div>
              </div>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button onClick={() => onDownload(f)} style={{ padding:"5px 12px", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", border:"1px solid rgba(34,211,238,.4)", color:"#22d3ee", background:"transparent", display:"inline-flex", alignItems:"center", gap:4 }}>
                  <Download size={12} /> Decrypt
                </button>
                <button onClick={() => setShareTarget(f)} style={{ padding:"5px 12px", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", border:"1px solid rgba(108,99,255,.4)", color:"#6c63ff", background:"transparent", display:"inline-flex", alignItems:"center", gap:4 }}>
                  <Share2 size={12} /> Share
                </button>
                <button onClick={() => setDeleteTarget(f)} style={{ padding:"5px 12px", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", border:"1px solid rgba(239,68,68,.3)", color:"#ef4444", background:"transparent", display:"inline-flex", alignItems:"center", gap:4 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
