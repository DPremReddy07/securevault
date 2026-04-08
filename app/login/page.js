"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { supabase } from "@/lib/supabase";
import { LogIn, Eye, EyeOff, ShieldCheck, Lock, Home } from "lucide-react";
import toast from "react-hot-toast";

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

// Fetch IP + geo using ipapi.co (free, no key needed, 1000 req/day)
async function getGeoInfo() {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      ip: d.ip,
      city: d.city,
      region: d.region,
      country: d.country_name,
      country_code: d.country_code,
      latitude: d.latitude,
      longitude: d.longitude,
    };
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const captchaRef = useRef(null);

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPw, setShowPw]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const handleCaptchaVerify = useCallback((token) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
    toast("CAPTCHA expired — please verify again.", { icon: "⏱" });
  }, []);

  const handleCaptchaError = useCallback(() => {
    setCaptchaToken(null);
    toast.error("CAPTCHA error. Please try again.");
  }, []);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA verification.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });
      if (error) throw error;

      // ── IP Geolocation + Anomaly Detection ──────────────────────────────
      const userId = data.user?.id;
      if (userId) {
        const geo = await getGeoInfo();
        if (geo) {
          // Fetch previous logins for this user (last 10)
          const { data: prevLogins } = await supabase
            .from("login_logs")
            .select("ip, country_code, latitude, longitude, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10);

          // Detect anomalies
          let threatFlag = null;
          if (prevLogins && prevLogins.length >= 2) {
            // Use majority country (most frequent) not just last login
            // This prevents false positives when a user always logs in from India
            const countryCounts = {};
            prevLogins.forEach(l => {
              if (l.country_code) countryCounts[l.country_code] = (countryCounts[l.country_code] || 0) + 1;
            });
            const majorityCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

            // Only flag if logging in from a DIFFERENT country than the majority
            if (majorityCountry && majorityCountry !== geo.country_code) {
              threatFlag = "new_country";
            }

            // Impossible travel: >500 km within 1 hour (compare to most recent)
            const last = prevLogins[0];
            const lastTime = new Date(last.created_at);
            const now = new Date();
            const diffHours = (now - lastTime) / 1000 / 3600;
            if (diffHours < 1 && last.latitude && last.longitude) {
              const dist = haversineKm(
                last.latitude, last.longitude,
                geo.latitude, geo.longitude
              );
              if (dist > 500) {
                threatFlag = "impossible_travel"; // impossible_travel overrides new_country
              }
            }
          }


          // Insert login log
          await supabase.from("login_logs").insert({
            user_id: userId,
            ip: geo.ip,
            city: geo.city,
            region: geo.region,
            country: geo.country,
            country_code: geo.country_code,
            latitude: geo.latitude,
            longitude: geo.longitude,
            threat_flag: threatFlag,
          });

          // Show threat alerts
          if (threatFlag === "impossible_travel") {
            toast(
              "⚠️ Impossible travel detected! Login from a different location within 1 hour.",
              { duration: 6000, style: { background: "#7f1d1d", color: "#fff" } }
            );
          } else if (threatFlag === "new_country") {
            toast(`🚨 New country login detected: ${geo.country}`, {
              duration: 5000,
              style: { background: "#78350f", color: "#fff" },
            });
          }
        }
      }
      // ────────────────────────────────────────────────────────────────────

      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      const msg = err.message || "";
      // Supabase returns "User is banned" when an admin has terminated the account
      if (msg.toLowerCase().includes("banned") || msg.toLowerCase().includes("user is banned")) {
        // Store email so the /terminated page can identify the user
        localStorage.setItem("sv_terminated_user", JSON.stringify({ email, userId: null }));
        toast("🔒 Your account has been suspended. Redirecting...", {
          duration: 3000,
          style: { background: "#7f1d1d", color: "#fff" },
        });
        setTimeout(() => router.push("/terminated"), 2000);
      } else {
        toast.error(msg || "Login failed. Please try again.");
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!email && !!password && !!captchaToken && !loading;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,110,247,0.18) 0%, var(--bg-base) 60%)",
        padding: "1.5rem",
      }}
    >
      <Link href="/" style={{ position: "absolute", top: "1.5rem", left: "1.5rem", color: "var(--text-secondary)", transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
        <Home size={24} />
      </Link>
      {/* Background mesh */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(79,110,247,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div
        className="vault-card animate-fadeInUp"
        style={{ width: "100%", maxWidth: "420px", padding: "2.5rem 2rem", position: "relative" }}
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
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              marginBottom: "1rem",
              animation: "pulse-glow 3s ease-in-out infinite",
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
            SecureVault
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Your encrypted password fortress
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} noValidate>
          {/* Email */}
          <div style={{ marginBottom: "1.125rem" }}>
            <label htmlFor="login-email" className="vault-label">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="vault-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="login-password" className="vault-label">Master Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                className="vault-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                id="toggle-password-visibility"
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--accent-light)",
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Forgot password?
              </Link>
            </div>
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
              id="login-captcha"
              sitekey={SITE_KEY}
              theme="dark"
              onVerify={handleCaptchaVerify}
              onExpire={handleCaptchaExpire}
              onError={handleCaptchaError}
              ref={captchaRef}
            />
          </div>

          {/* Status hint */}
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
              Complete the CAPTCHA above to enable sign-in
            </p>
          )}

          <button
            id="login-submit"
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
              <LogIn size={17} />
            )}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="vault-divider" style={{ margin: "1.5rem 0" }}>or</div>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{ color: "var(--accent-light)", fontWeight: 600, textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Create one free
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
          AES-256 client-side encryption · Protected by hCaptcha
        </div>
      </div>
    </div>
  );
}

// ── Haversine formula — great-circle distance between two points in km ──
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
