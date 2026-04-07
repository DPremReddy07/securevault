// hooks/useVault.js
// Manages file vault and password vault state + Supabase CRUD.
// Use inside any "use client" component.

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { encryptFile, decryptAndDownload, encrypt, decrypt } from "@/lib/encryptionService";
import toast from "react-hot-toast";

async function logAction(uid, action, detail) {
  try { await supabase.from("audit_logs").insert({ user_id: uid, action, detail }); } catch {}
}

// ── File Vault ────────────────────────────────────────────────────────────────
export function useFileVault(user, isAdmin) {
  const [files, setFiles]           = useState([]);
  const [uploading, setUploading]   = useState(false);
  const [uploadPct, setUploadPct]   = useState(0);
  const fileInputRef                = useRef(null);

  const fetchFiles = useCallback(async () => {
    if (!user) return;
    let q = supabase.from("files").select("*").order("created_at", { ascending: false });
    if (!isAdmin) q = q.eq("user_id", user.id);
    const { data } = await q;
    setFiles(data || []);
  }, [user, isAdmin]);

  const handleUpload = useCallback(async (file) => {
    if (!file || !user) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("Max file size is 50 MB"); return; }
    setUploading(true); setUploadPct(0);
    const interval = setInterval(() => setUploadPct(p => Math.min(p + Math.random() * 15, 90)), 80);
    try {
      const encrypted = await encryptFile(file);
      const { error } = await supabase.from("files").insert({
        user_id: user.id, name: file.name, size: file.size, encrypted_data: encrypted,
      });
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
  }, [user, fetchFiles]);

  const handleDownload = useCallback(async (f) => {
    try {
      decryptAndDownload(f.encrypted_data, f.name);
      await logAction(user.id, "DOWNLOAD", f.name);
      toast.success(`🔓 ${f.name} decrypted`);
    } catch (err) { toast.error(err.message); }
  }, [user]);

  const handleDelete = useCallback(async (f) => {
    const { error } = await supabase.from("files").delete().eq("id", f.id);
    if (error) { toast.error(error.message); return; }
    await logAction(user.id, "DELETE", f.name);
    setFiles(p => p.filter(x => x.id !== f.id));
    toast.success("🗑️ File deleted");
  }, [user]);

  return { files, setFiles, uploading, uploadPct, fileInputRef, fetchFiles, handleUpload, handleDownload, handleDelete };
}

// ── Password Vault ────────────────────────────────────────────────────────────
export function usePasswordVault(user) {
  const [passwords, setPasswords]       = useState([]);
  const [revealedPws, setRevealedPws]   = useState({});

  const fetchPasswords = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("vault_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPasswords(data || []);
  }, [user]);

  const savePassword = useCallback(async ({ site, username, pass }) => {
    const encrypted_password = encrypt(pass);
    const { data, error } = await supabase
      .from("vault_entries")
      .insert({ user_id: user.id, site, username, encrypted_password })
      .select().single();
    if (error) { toast.error(error.message); return false; }
    setPasswords(p => [data, ...p]);
    await logAction(user.id, "UPLOAD", `Password for ${site} saved`);
    toast.success("🔐 Password encrypted & saved");
    return true;
  }, [user]);

  const toggleReveal = useCallback((id, encrypted_password) => {
    if (revealedPws[id]) {
      setRevealedPws(p => { const n = { ...p }; delete n[id]; return n; });
      return;
    }
    try {
      const plain = decrypt(encrypted_password);
      setRevealedPws(p => ({ ...p, [id]: plain }));
      logAction(user.id, "REVEAL", "Password revealed");
      toast("👁 Password revealed — hide when done", { icon: "⚠️" });
    } catch (err) { toast.error(err.message); }
  }, [user, revealedPws]);

  return { passwords, setPasswords, revealedPws, fetchPasswords, savePassword, toggleReveal };
}
