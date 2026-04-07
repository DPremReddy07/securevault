// components/ui/Modal.jsx
// Generic styled modal — replaces the three inline modals in dashboard/page.js.
// Usage:
//   <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
//     <p>Delete {deleteTarget?.name}?</p>
//     <ModalActions onCancel={() => setDeleteTarget(null)} onConfirm={doDelete} confirmLabel="Delete" danger />
//   </Modal>

"use client";

export default function Modal({ open, onClose, title, children, maxWidth = 420 }) {
  if (!open) return null;
  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background:"#161b24", border:"1px solid #ffffff25", borderRadius:16, padding:24, width:"90%", maxWidth, boxShadow:"0 20px 60px rgba(0,0,0,.6)" }}
        onClick={e => e.stopPropagation()}
      >
        {title && <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:"#e2e8f0" }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

/** Reusable action row for modals */
export function ModalActions({ onCancel, onConfirm, confirmLabel = "Confirm", danger = false }) {
  return (
    <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:16 }}>
      <button
        onClick={onCancel}
        style={{ padding:"9px 18px", background:"transparent", border:"1px solid #ffffff20", borderRadius:8, color:"#94a3b8", fontSize:13, cursor:"pointer" }}
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        style={{ padding:"9px 18px", background: danger ? "#ef4444" : "linear-gradient(135deg,#6c63ff,#a855f7)", border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

/** Simple text input for modals */
export function ModalInput({ placeholder, value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{ width:"100%", padding:"10px 13px", background:"#1c2130", border:"1px solid #ffffff12", borderRadius:9, color:"#e2e8f0", fontSize:13, outline:"none", marginBottom:10 }}
      onFocus={e => (e.target.style.borderColor = "#6c63ff")}
      onBlur={e => (e.target.style.borderColor = "#ffffff12")}
    />
  );
}
