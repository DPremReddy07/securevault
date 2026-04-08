"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { supabase } from "@/lib/supabase";
import { UserPlus, Eye, EyeOff, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

/* ── Password strength indicator ── */
function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ chars",  ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number",    ok: /[0-9]/.test(password) },
    { label: "Symbol",    ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColor  = ["#ef4444","#f59e0b","#f59e0b","#10b981","#10b981"][score];
  const barLabel  = ["","Weak","Fair","Good","Strong"][score];

  if (!password) return null;

  return (
    <div style={{ marginTop: "0.625rem" }}>
      {/* Bars */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "0.4rem" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "3px",
              borderRadius: "2px",
              background: i < score ? barColor : "var(--border)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      {/* Labels */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: barColor, fontWeight: 600 }}>{barLabel}</span>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          {checks.map(({ label, ok }) => (
            <span
              key={label}
              style={{
                fontSize: "0.6875rem",
                color: ok ? "#10b981" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "2px",
                transition: "color 0.2s",
              }}
            >
              {ok && <CheckCircle2 size={9} />}
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Register page ── */
export default function RegisterPage() {
  const router = useRouter();
  const captchaRef = useRef(null);

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showCon, setShowCon]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleCaptchaVerify = useCallback((token) => setCaptchaToken(token), []);
  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
    toast("CAPTCHA expired — please verify again.", { icon: "⏱" });
  }, []);
  const handleCaptchaError = useCallback(() => {
    setCaptchaToken(null);
    toast.error("CAPTCHA error. Please try again.");
  }, []);

  async function handleRegister(e) {
    e.preventDefault();

    if (!email || !password || !confirm) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA verification.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { captchaToken },
      });
      if (error) throw error;

      // If email confirmation is disabled in Supabase, session is created immediately
      if (data.session) {
        toast.success("Account created! Taking you to your vault…");
        router.push("/dashboard");
      } else {
        toast.success("Account created! Check your email to confirm your address.");
        router.push("/login");
      }
    } catch (err) {
      toast.error(err.message || "Registration failed. Try again.");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  }

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = !!email && !!password && !!confirm && passwordsMatch && !!captchaToken && !loading;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(168,85,247,0.15) 0%, var(--bg-base) 60%)",
        padding: "1.5rem",
      }}
    >
      {/* Background mesh */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(168,85,247,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div
        className="vault-card animate-fadeInUp"
        style={{ width: "100%", maxWidth: "440px", padding: "2.5rem 2rem", position: "relative" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "60px",
              height: "60px",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, var(--accent-2), var(--accent))",
              marginBottom: "1rem",
            }}
          >
            <ShieldCheck size={30} color="#fff" strokeWidth={2} />
          </div>
          <h1
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Create Account
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Join SecureVault — no credit card needed
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} noValidate>
          {/* Email */}
          <div style={{ marginBottom: "1.125rem" }}>
            <label htmlFor="register-email" className="vault-label">Email</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              className="vault-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.125rem" }}>
            <label htmlFor="register-password" className="vault-label">Master Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="register-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                className="vault-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                id="toggle-new-password"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", color: "var(--text-muted)", cursor: "pointer",
                  padding: "0.25rem", display: "flex", alignItems: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="register-confirm" className="vault-label">Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="register-confirm"
                type={showCon ? "text" : "password"}
                autoComplete="new-password"
                className="vault-input"
                placeholder="••••••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={{
                  paddingRight: "2.75rem",
                  borderColor: passwordsMismatch
                    ? "var(--danger)"
                    : passwordsMatch
                    ? "var(--success)"
                    : undefined,
                  boxShadow: passwordsMismatch
                    ? "0 0 0 3px rgba(239,68,68,0.15)"
                    : passwordsMatch
                    ? "0 0 0 3px rgba(16,185,129,0.15)"
                    : undefined,
                }}
              />
              <button
                type="button"
                id="toggle-confirm-password"
                onClick={() => setShowCon((v) => !v)}
                aria-label={showCon ? "Hide confirm password" : "Show confirm password"}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", color: "var(--text-muted)", cursor: "pointer",
                  padding: "0.25rem", display: "flex", alignItems: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {showCon ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {passwordsMismatch && (
              <p style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.375rem" }}>
                Passwords do not match
              </p>
            )}
            {passwordsMatch && (
              <p style={{ fontSize: "0.75rem", color: "var(--success)", marginTop: "0.375rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={12} /> Passwords match
              </p>
            )}
          </div>

          {/* hCaptcha */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.25rem",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
            }}
          >
            <HCaptcha
              id="register-captcha"
              sitekey={SITE_KEY}
              theme="dark"
              onVerify={handleCaptchaVerify}
              onExpire={handleCaptchaExpire}
              onError={handleCaptchaError}
              ref={captchaRef}
            />
          </div>

          {/* Captcha hint */}
          {!captchaToken && (
            <p
              style={{
                textAlign: "center",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: "0.875rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem",
              }}
            >
              <Lock size={11} />
              Complete the CAPTCHA above to create your account
            </p>
          )}

          <button
            id="register-submit"
            type="submit"
            className="vault-btn-primary"
            disabled={!canSubmit}
          >
            {loading ? (
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
                className="animate-spin"
              />
            ) : (
              <UserPlus size={17} />
            )}
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="vault-divider" style={{ margin: "1.5rem 0" }}>or</div>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "var(--accent-light)", fontWeight: 600, textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Sign in
          </Link>
        </p>

        {/* Security badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            marginTop: "1.75rem",
            color: "var(--text-muted)",
            fontSize: "0.75rem",
          }}
        >
          <Lock size={12} />
          Your data is encrypted before leaving your device · Protected by hCaptcha
        </div>
      </div>
    </div>
  );
}
