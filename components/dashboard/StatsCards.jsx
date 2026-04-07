// components/dashboard/StatsCards.jsx
"use client";

export default function StatsCards({ fileCount, totalSize, threatCount, auditCount }) {
  const stats = [
    { val: fileCount,    label: "Encrypted Files", color: "#6c63ff" },
    { val: totalSize,    label: "Total Size",       color: "#10b981" },
    { val: threatCount,  label: "Active Threats",   color: threatCount ? "#ef4444" : "#10b981" },
    { val: auditCount,   label: "Audit Events",     color: "#f59e0b" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background:"#1c2130", border:"1px solid #ffffff12", borderRadius:10, padding:14, textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:800, fontFamily:"monospace", color:s.color }}>{s.val}</div>
          <div style={{ fontSize:11, color:"#64748b", marginTop:3, textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
