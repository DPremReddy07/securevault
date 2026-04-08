"use client";
import { useEffect } from "react";
import Link from "next/link";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@400;600;700;800&family=Fraunces:ital,wght@0,300;0,700;1,300;1,700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#070910;--surface:#0d1117;--card:#111822;--card2:#161e2b;--border:#ffffff0e;--border2:#ffffff1a;--border3:#ffffff28;--accent:#6c63ff;--accent2:#a855f7;--accent3:#22d3ee;--green:#10b981;--danger:#ef4444;--warn:#f59e0b;--text:#e2e8f0;--text2:#94a3b8;--text3:#475569;--font:'Syne',sans-serif;--mono:'JetBrains Mono',monospace;--serif:'Fraunces',serif;--grad:linear-gradient(135deg,var(--accent),var(--accent2));--grad2:linear-gradient(135deg,var(--accent3),var(--accent));}
#sv-home{background:var(--bg);color:var(--text);font-family:var(--font);overflow-x:hidden;min-height:100vh;cursor:none;scroll-behavior:smooth}
#cursor{position:fixed;width:12px;height:12px;background:var(--accent);border-radius:50%;pointer-events:none;z-index:9999;transition:transform .15s,background .2s;mix-blend-mode:screen}
#cursor-ring{position:fixed;width:36px;height:36px;border:1px solid var(--accent);border-radius:50%;pointer-events:none;z-index:9998;transition:all .12s;opacity:.5}
.noise-overlay{position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");opacity:.025;pointer-events:none;z-index:0}
nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 40px;height:64px;display:flex;align-items:center;justify-content:space-between;background:#070910cc;backdrop-filter:blur(20px);border-bottom:1px solid var(--border);transition:border-color .3s}
.nav-logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;letter-spacing:-.5px}
.nav-logo-icon{width:32px;height:32px;background:var(--grad);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px}
.nav-links{display:flex;gap:32px;align-items:center}
.nav-links a{font-size:13px;color:var(--text2);text-decoration:none;font-weight:600;letter-spacing:.3px;transition:color .2s}
.nav-links a:hover{color:var(--text)}
.nav-cta{padding:8px 20px;background:var(--grad);border-radius:8px;font-size:13px;font-weight:700;color:#fff!important;text-decoration:none;transition:opacity .2s;box-shadow:0 0 20px #6c63ff40}
.nav-cta:hover{opacity:.85}
.nav-tag{font-family:var(--mono);font-size:10px;background:#10b98118;color:var(--green);border:1px solid #10b98130;padding:2px 8px;border-radius:20px;letter-spacing:.5px}
.hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:100px 40px 80px}
.hero-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%);animation:gridDrift 20s ease-in-out infinite alternate}
@keyframes gridDrift{from{background-position:0 0}to{background-position:30px 30px}}
.hero-glow{position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,#6c63ff18 0%,#a855f708 40%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-55%);animation:glowPulse 4s ease-in-out infinite alternate;pointer-events:none}
@keyframes glowPulse{from{opacity:.6;transform:translate(-50%,-55%) scale(1)}to{opacity:1;transform:translate(-50%,-55%) scale(1.08)}}
.hero-orb1{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#22d3ee12,transparent 70%);top:10%;right:5%;animation:orbFloat 8s ease-in-out infinite alternate}
.hero-orb2{position:absolute;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,#a855f715,transparent 70%);bottom:20%;left:8%;animation:orbFloat 6s ease-in-out infinite alternate-reverse}
@keyframes orbFloat{from{transform:translateY(0) scale(1)}to{transform:translateY(-30px) scale(1.1)}}
.hero-content{position:relative;z-index:2;text-align:center;max-width:900px}
.hero-badge{display:inline-flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;color:var(--accent3);background:#22d3ee10;border:1px solid #22d3ee25;padding:6px 14px;border-radius:20px;margin-bottom:32px;letter-spacing:.5px;animation:fadeUp .6s ease both}
.hero-badge::before{content:'●';color:var(--green);animation:blink 1.5s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.hero-title{font-family:var(--serif);font-size:clamp(52px,8vw,100px);font-weight:700;line-height:1;letter-spacing:-2px;margin-bottom:24px;animation:fadeUp .6s ease .1s both}
.t-plain{color:var(--text)}.t-grad{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.t-italic{font-style:italic;font-weight:300;color:var(--text2)}
.hero-sub{font-size:18px;color:var(--text2);max-width:580px;margin:0 auto 40px;line-height:1.7;animation:fadeUp .6s ease .2s both}
.hero-actions{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;animation:fadeUp .6s ease .3s both}
.btn-primary{padding:14px 32px;background:var(--grad);border-radius:10px;color:#fff;font-weight:700;font-size:15px;text-decoration:none;transition:all .25s;box-shadow:0 0 30px #6c63ff40;display:inline-flex;align-items:center;gap:8px}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 50px #6c63ff60}
.btn-ghost{padding:14px 32px;border:1px solid var(--border3);border-radius:10px;color:var(--text2);font-weight:700;font-size:15px;text-decoration:none;transition:all .25s;display:inline-flex;align-items:center;gap:8px}
.btn-ghost:hover{border-color:var(--accent);color:var(--text);background:#6c63ff08}
.hero-stats{display:flex;gap:40px;justify-content:center;margin-top:60px;padding-top:40px;border-top:1px solid var(--border);animation:fadeUp .6s ease .4s both;flex-wrap:wrap}
.hero-stat{text-align:center}.hero-stat-n{font-family:var(--serif);font-size:36px;font-weight:700;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1}
.hero-stat-l{font-size:12px;color:var(--text3);margin-top:4px;font-family:var(--mono);letter-spacing:.5px}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
section{position:relative;z-index:1}
.section-label{font-family:var(--mono);font-size:11px;color:var(--accent);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.section-label::before{content:'';display:inline-block;width:24px;height:1px;background:var(--accent)}
.section-title{font-family:var(--serif);font-size:clamp(32px,5vw,52px);font-weight:700;letter-spacing:-1px;line-height:1.1;margin-bottom:16px}
.section-sub{font-size:16px;color:var(--text2);line-height:1.7;max-width:560px}
.container{max-width:1200px;margin:0 auto;padding:0 40px}
.problem-band{padding:60px 0;background:#ef444408;border-top:1px solid #ef444420;border-bottom:1px solid #ef444420}
.problem-band .container{display:flex;gap:48px;align-items:center;flex-wrap:wrap}
.problem-icon{font-size:48px;flex-shrink:0}
.problem-text h3{font-size:22px;font-weight:700;margin-bottom:8px;color:var(--danger)}
.problem-text p{font-size:15px;color:var(--text2);line-height:1.6}
.problem-stats{display:flex;gap:32px;flex-wrap:wrap;margin-left:auto}
.pstat{text-align:center;padding:16px 24px;background:#ef444410;border:1px solid #ef444425;border-radius:12px}
.pstat-n{font-family:var(--serif);font-size:28px;font-weight:700;color:var(--danger)}
.pstat-l{font-size:11px;color:var(--text3);font-family:var(--mono);margin-top:4px}
.why-section{padding:120px 0}
.why-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-top:64px}
.why-visual{position:relative;height:480px}.vault-diagram{width:100%;height:100%;position:relative}
.vd-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:120px;height:120px;background:var(--grad);border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:48px;box-shadow:0 0 60px #6c63ff40,0 0 120px #6c63ff20;animation:lockPulse 3s ease-in-out infinite}
@keyframes lockPulse{0%,100%{box-shadow:0 0 60px #6c63ff40,0 0 120px #6c63ff20}50%{box-shadow:0 0 80px #6c63ff60,0 0 160px #6c63ff35}}
.vd-ring{position:absolute;top:50%;left:50%;border-radius:50%;border:1px solid;animation:ringPulse 3s ease-in-out infinite;transform:translate(-50%,-50%)}
.vd-ring1{width:200px;height:200px;border-color:#6c63ff40;animation-delay:0s}.vd-ring2{width:280px;height:280px;border-color:#a855f725;animation-delay:.5s}.vd-ring3{width:360px;height:360px;border-color:#22d3ee15;animation-delay:1s}
@keyframes ringPulse{0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.03)}}
.vd-node{position:absolute;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;border:1px solid;animation:nodeFloat 4s ease-in-out infinite alternate}
@keyframes nodeFloat{from{transform:translateY(0)}to{transform:translateY(-8px)}}
.vd-node.browser{top:8%;left:10%;background:#22d3ee15;border-color:#22d3ee35;animation-delay:.2s}
.vd-node.db{bottom:8%;right:10%;background:#a855f715;border-color:#a855f735;animation-delay:.6s}
.vd-node.user{top:8%;right:10%;background:#10b98115;border-color:#10b98135;animation-delay:1s}
.vd-node.cloud{bottom:8%;left:10%;background:#f59e0b15;border-color:#f59e0b35;animation-delay:1.4s}
.vd-label{position:absolute;font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;line-height:1.3}
.vd-badge{position:absolute;font-family:var(--mono);font-size:9px;padding:3px 8px;border-radius:20px;letter-spacing:.5px}
.vd-badge.enc{background:#10b98118;color:var(--green);border:1px solid #10b98130;top:50%;left:50%;transform:translate(-80px,-30px) translateY(-50%);white-space:nowrap}
.vd-badge.cipher{background:#6c63ff18;color:var(--accent);border:1px solid #6c63ff30;top:50%;left:50%;transform:translate(10px,10px);white-space:nowrap}
.why-points{display:flex;flex-direction:column;gap:24px}
.why-point{display:flex;gap:20px;align-items:flex-start;padding:20px;border-radius:14px;border:1px solid var(--border);background:var(--card);transition:all .3s}
.why-point:hover{border-color:#6c63ff40;background:var(--card2);transform:translateX(6px)}
.wp-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.wp-icon.purple{background:#6c63ff18;border:1px solid #6c63ff30}.wp-icon.cyan{background:#22d3ee18;border:1px solid #22d3ee30}.wp-icon.green{background:#10b98118;border:1px solid #10b98130}.wp-icon.orange{background:#f59e0b18;border:1px solid #f59e0b30}
.wp-title{font-size:15px;font-weight:700;margin-bottom:4px}.wp-desc{font-size:13px;color:var(--text2);line-height:1.6}
.features-section{padding:120px 0;background:linear-gradient(180deg,transparent,#0d111750,transparent)}
.features-header{text-align:center;margin-bottom:72px}.features-header .section-label{justify-content:center}
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.feat-card{padding:28px;border-radius:18px;border:1px solid var(--border);background:var(--card);transition:all .35s;position:relative;overflow:hidden}
.feat-card::before{content:'';position:absolute;inset:0;background:var(--grad);opacity:0;transition:opacity .35s;border-radius:18px}
.feat-card:hover{border-color:#6c63ff40;transform:translateY(-4px);box-shadow:0 20px 60px #6c63ff15}.feat-card:hover::before{opacity:.04}
.feat-card-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:20px;position:relative;z-index:1}
.feat-card-icon.v1{background:#6c63ff18;border:1px solid #6c63ff30}.feat-card-icon.v2{background:#a855f718;border:1px solid #a855f730}.feat-card-icon.v3{background:#22d3ee18;border:1px solid #22d3ee30}.feat-card-icon.v4{background:#10b98118;border:1px solid #10b98130}.feat-card-icon.v5{background:#f59e0b18;border:1px solid #f59e0b30}.feat-card-icon.v6{background:#ef444418;border:1px solid #ef444430}
.feat-card h3{font-size:16px;font-weight:700;margin-bottom:8px;position:relative;z-index:1}
.feat-card p{font-size:13px;color:var(--text2);line-height:1.65;position:relative;z-index:1}
.feat-tag{display:inline-block;font-family:var(--mono);font-size:10px;padding:2px 8px;border-radius:4px;margin-top:14px;position:relative;z-index:1}
.feat-tag.new{background:#22d3ee18;color:var(--accent3);border:1px solid #22d3ee30}.feat-tag.ai{background:#a855f718;color:var(--accent2);border:1px solid #a855f730}.feat-tag.core{background:#10b98118;color:var(--green);border:1px solid #10b98130}
.flow-section{padding:120px 0}.flow-section .container{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.flow-steps{display:flex;flex-direction:column;gap:0}
.flow-step{display:flex;gap:20px;padding-bottom:32px;position:relative}
.flow-step:not(:last-child)::after{content:'';position:absolute;left:19px;top:44px;bottom:0;width:1px;background:linear-gradient(var(--border2),transparent)}
.flow-num{width:40px;height:40px;border-radius:50%;background:var(--card2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:13px;font-weight:700;color:var(--accent);flex-shrink:0}
.flow-content h4{font-size:15px;font-weight:700;margin-bottom:6px}.flow-content p{font-size:13px;color:var(--text2);line-height:1.6}
.flow-code{background:var(--card2);border:1px solid var(--border2);border-radius:14px;padding:24px;font-family:var(--mono);font-size:12px;line-height:1.8;position:relative;overflow:hidden}
.flow-code::before{content:'LIVE DEMO';position:absolute;top:12px;right:12px;font-size:9px;background:#10b98118;color:var(--green);border:1px solid #10b98130;padding:2px 8px;border-radius:4px;letter-spacing:.5px}
.code-comment{color:var(--text3)}.code-key{color:var(--accent3)}.code-str{color:var(--accent2)}.code-fn{color:var(--accent)}.code-val{color:var(--green)}
.code-cursor{display:inline-block;width:2px;height:14px;background:var(--accent3);margin-left:2px;animation:blink 1s infinite;vertical-align:middle}
.compare-section{padding:120px 0;background:linear-gradient(180deg,transparent,#0d111730,transparent)}
.compare-header{text-align:center;margin-bottom:64px}.compare-table-wrap{overflow-x:auto}
.compare-table{width:100%;border-collapse:separate;border-spacing:0;border-radius:16px;overflow:hidden;border:1px solid var(--border)}
.compare-table th{padding:18px 24px;font-size:13px;font-weight:700;background:var(--card2);border-bottom:1px solid var(--border);text-align:left}
.compare-table th.hl{background:#6c63ff15;border-bottom:2px solid var(--accent);color:var(--accent)}
.compare-table td{padding:16px 24px;font-size:13px;color:var(--text2);border-bottom:1px solid var(--border)}
.compare-table td.hl{background:#6c63ff05;border-left:1px solid #6c63ff20;border-right:1px solid #6c63ff20}
.compare-table tr:last-child td{border-bottom:none}
.ck{color:var(--green);font-size:16px}.cx{color:var(--danger);font-size:16px}.cp{color:var(--warn);font-size:16px}
.scale-section{padding:120px 0}.scale-header{text-align:center;margin-bottom:80px}
.scale-tiers{display:flex;flex-direction:column;gap:32px;max-width:900px;margin:0 auto}
.scale-tier{display:flex;gap:24px;align-items:flex-start;padding:28px;border-radius:18px;border:1px solid var(--border);background:var(--card);position:relative;transition:all .3s}
.scale-tier:hover{border-color:var(--border2);transform:translateX(4px)}
.tier-badge{position:absolute;top:-12px;left:24px;font-family:var(--mono);font-size:10px;padding:3px 12px;border-radius:20px;letter-spacing:.8px;font-weight:700}
.tier-badge.t1{background:#10b98120;color:var(--green);border:1px solid #10b98140}.tier-badge.t2{background:#6c63ff20;color:var(--accent);border:1px solid #6c63ff40}.tier-badge.t3{background:#a855f720;color:var(--accent2);border:1px solid #a855f740}.tier-badge.t4{background:#f59e0b20;color:var(--warn);border:1px solid #f59e0b40}
.tier-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0}
.tier-icon.t1{background:#10b98115;border:1px solid #10b98130}.tier-icon.t2{background:#6c63ff15;border:1px solid #6c63ff30}.tier-icon.t3{background:#a855f715;border:1px solid #a855f730}.tier-icon.t4{background:#f59e0b15;border:1px solid #f59e0b30}
.tier-content h3{font-size:17px;font-weight:700;margin-bottom:6px}.tier-cost{font-family:var(--mono);font-size:12px;color:var(--text3);margin-bottom:12px}
.tier-content p{font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:14px}
.tier-stack{display:flex;flex-wrap:wrap;gap:8px}.tier-chip{font-family:var(--mono);font-size:10px;padding:3px 10px;border-radius:6px;background:var(--card2);border:1px solid var(--border2);color:var(--text3)}
.student-note{padding:80px 0}
.student-card{background:linear-gradient(135deg,#6c63ff10,#a855f705);border:1px solid #6c63ff25;border-radius:24px;padding:48px;display:flex;gap:40px;align-items:center;flex-wrap:wrap;position:relative;overflow:hidden}
.student-card::before{content:'';position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:radial-gradient(circle,#a855f720,transparent 70%);border-radius:50%;pointer-events:none}
.student-emoji{font-size:64px;flex-shrink:0}
.student-text h2{font-family:var(--serif);font-size:28px;font-weight:700;margin-bottom:12px;letter-spacing:-.5px}
.student-text p{font-size:15px;color:var(--text2);line-height:1.7;margin-bottom:20px}
.student-free-stack{display:flex;flex-wrap:wrap;gap:10px}
.free-chip{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11px;padding:6px 12px;border-radius:8px;background:#10b98112;border:1px solid #10b98125;color:var(--green)}
.free-chip::before{content:'✓';font-weight:700}
.cta-section{padding:120px 0;text-align:center;position:relative;overflow:hidden}
.cta-section::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 50% 100%,#6c63ff15,transparent 70%);pointer-events:none}
.cta-section h2{font-family:var(--serif);font-size:clamp(36px,6vw,72px);font-weight:700;letter-spacing:-2px;line-height:1.05;margin-bottom:24px;position:relative;z-index:1}
.cta-section p{font-size:17px;color:var(--text2);max-width:500px;margin:0 auto 40px;line-height:1.7;position:relative;z-index:1}
.cta-actions{display:flex;gap:16px;justify-content:center;position:relative;z-index:1;flex-wrap:wrap}
.cta-mono{font-family:var(--mono);font-size:12px;color:var(--text3);margin-top:24px;position:relative;z-index:1}
footer{border-top:1px solid var(--border);padding:40px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.footer-logo{font-weight:800;font-size:16px;display:flex;align-items:center;gap:8px}
.footer-logo-icon{width:24px;height:24px;background:var(--grad);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
.footer-links{display:flex;gap:24px}.footer-links a{font-size:12px;color:var(--text3);text-decoration:none;font-family:var(--mono);transition:color .2s}.footer-links a:hover{color:var(--text2)}
.footer-copy{font-size:12px;color:var(--text3);font-family:var(--mono)}
.reveal{opacity:0;transform:translateY(32px);transition:opacity .7s ease,transform .7s ease}.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-delay1{transition-delay:.1s}.reveal-delay2{transition-delay:.2s}.reveal-delay3{transition-delay:.3s}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border3);border-radius:3px}::-webkit-scrollbar-thumb:hover{background:#6c63ff60}
.ticker-wrap{background:#6c63ff10;border-top:1px solid #6c63ff20;border-bottom:1px solid #6c63ff20;padding:10px 0;overflow:hidden}
.ticker{display:flex;white-space:nowrap;animation:ticker 30s linear infinite}
.ticker-item{font-family:var(--mono);font-size:11px;color:var(--accent3);padding:0 40px;letter-spacing:.5px}
.ticker-item::before{content:'◆';margin-right:16px;color:#6c63ff70}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(max-width:900px){.why-grid,.flow-section .container{grid-template-columns:1fr}.why-visual{height:300px}.features-grid{grid-template-columns:1fr 1fr}.nav-links{display:none}.hero-stats{gap:20px}nav{padding:0 20px}.container{padding:0 20px}.hero{padding:100px 20px 60px}}
@media(max-width:600px){.features-grid{grid-template-columns:1fr}}
`;

const TICKERS = ['AES-256 CBC ENCRYPTION', 'CLIENT-SIDE ONLY', 'SUPABASE REALTIME', 'HCAPTCHA PROTECTED', 'ROLE-BASED ACCESS', 'AI SECURITY ASSISTANT', 'LOGIN ANOMALY DETECTION', 'LIVE AUDIT LOG', 'PASSWORD VAULT', 'ZERO KNOWLEDGE ARCHITECTURE'];

export default function HomePage() {
  useEffect(() => {
    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursor-ring');
    if (!cursor || !ring) return;
    let mx = 0, my = 0, rx = 0, ry = 0, raf;
    const onMove = e => { mx = e.clientX; my = e.clientY; cursor.style.left = (mx - 6) + 'px'; cursor.style.top = (my - 6) + 'px'; };
    document.addEventListener('mousemove', onMove);
    function animRing() { rx += (mx - rx) * .12; ry += (my - ry) * .12; ring.style.left = (rx - 18) + 'px'; ring.style.top = (ry - 18) + 'px'; raf = requestAnimationFrame(animRing); }
    animRing();
    const hEls = document.querySelectorAll('#sv-home a,#sv-home button,[class*="card"],[class*="tier"],[class*="point"]');
    const onIn = () => { cursor.style.transform = 'scale(2)'; cursor.style.background = 'var(--accent2)'; ring.style.opacity = '1'; ring.style.borderColor = 'var(--accent2)'; };
    const onOut = () => { cursor.style.transform = 'scale(1)'; cursor.style.background = 'var(--accent)'; ring.style.opacity = '.5'; ring.style.borderColor = 'var(--accent)'; };
    hEls.forEach(el => { el.addEventListener('mouseenter', onIn); el.addEventListener('mouseleave', onOut); });
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }), { threshold: .12 });
    document.querySelectorAll('#sv-home .reveal').forEach(el => obs.observe(el));
    const onScroll = () => {
      const nav = document.querySelector('#sv-home nav'); if (nav) nav.style.borderBottomColor = window.scrollY > 20 ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.06)';
      const glow = document.querySelector('.hero-glow'); if (glow) glow.style.transform = `translate(-50%, calc(-55% + ${window.scrollY * .3}px))`;
    };
    window.addEventListener('scroll', onScroll);
    return () => { document.removeEventListener('mousemove', onMove); window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); obs.disconnect(); hEls.forEach(el => { el.removeEventListener('mouseenter', onIn); el.removeEventListener('mouseleave', onOut); }); };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div id="cursor" /><div id="cursor-ring" />
      <div id="sv-home">
        <div className="noise-overlay" />

        {/* NAV */}
        <nav>
          <div className="nav-logo"><div className="nav-logo-icon">🔐</div>SecureVault<span className="nav-tag">BETA</span></div>
          <div className="nav-links"><a href="#why">Why Us</a><a href="#features">Features</a><a href="#compare">Compare</a><a href="#scale">Scale</a></div>
          <Link href="/register" className="nav-cta">Open Vault →</Link>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-grid" /><div className="hero-glow" /><div className="hero-orb1" /><div className="hero-orb2" />
          <div className="hero-content">
            <div className="hero-badge">AES-256 · BROWSER-SIDE · ZERO KNOWLEDGE</div>
            <h1 className="hero-title"><span className="t-plain">Your secrets,</span><br /><span className="t-grad">encrypted</span><br /><span className="t-italic">before they move.</span></h1>
            <p className="hero-sub">SecureVault encrypts every file and password <em>inside your browser</em> using AES-256 before touching any server. Even we can&apos;t read your data.</p>
            <div className="hero-actions">
              <Link href="/register" className="btn-primary">🔐 Open Your Vault</Link>
              <a href="#why" className="btn-ghost">See how it works ↓</a>
            </div>
            <div className="hero-stats">
              {[['256‑bit', 'AES ENCRYPTION'], ['0', 'PLAINTEXT ON SERVER'], ['4', 'VAULT FEATURES'], ['100%', 'FREE FOR STUDENTS']].map(([n, l]) => (
                <div key={l} className="hero-stat"><div className="hero-stat-n">{n}</div><div className="hero-stat-l">{l}</div></div>
              ))}
            </div>
          </div>
        </section>

        {/* TICKER */}
        <div className="ticker-wrap"><div className="ticker">{[...TICKERS, ...TICKERS].map((t, i) => <span key={i} className="ticker-item">{t}</span>)}</div></div>

        {/* PROBLEM */}
        <div className="problem-band">
          <div className="container">
            <div className="problem-icon">⚠️</div>
            <div className="problem-text"><h3>The cloud stores your files. But can you trust it?</h3><p>Traditional cloud storage encrypts data <em>after</em> it arrives — meaning they hold the keys. One breach, one subpoena, and your files are exposed.</p></div>
            <div className="problem-stats">
              {[['8.2B', 'RECORDS BREACHED 2023'], ['$4.5M', 'AVG BREACH COST'], ['83%', 'CLOUD-STORED DATA']].map(([n, l]) => (
                <div key={l} className="pstat"><div className="pstat-n">{n}</div><div className="pstat-l">{l}</div></div>
              ))}
            </div>
          </div>
        </div>

        {/* WHY */}
        <section className="why-section" id="why">
          <div className="container">
            <div className="why-grid">
              <div>
                <div className="section-label reveal">The SecureVault difference</div>
                <h2 className="section-title reveal reveal-delay1">Encryption<br /><em style={{ fontStyle: 'italic', color: 'var(--text2)', fontFamily: 'var(--serif)' }}>happens here,</em><br />not there.</h2>
                <p className="section-sub reveal reveal-delay2" style={{ marginBottom: 36 }}>Every byte is locked inside your browser before it travels. The server is a dumb ciphertext warehouse.</p>
                <div className="why-points">
                  {[['purple', '🔑', 'Zero-Knowledge Architecture', 'Your encryption key never leaves your device. Even if the database is dumped entirely, every row is unreadable ciphertext.'],
                  ['cyan', '🤖', 'AI Security Assistant', 'Ask "am I secure?" and get a real answer. Claude reads your vault context — files, audit logs, threats — and gives personalized advice.'],
                  ['green', '🌍', 'Login Threat Detection', 'Every login is geolocated. New country? Impossible travel? You get an instant alert and a dot on the map.'],
                  ['orange', '📊', 'Live Audit Log', 'Every upload, download, reveal, and delete is recorded in real-time via Supabase WebSockets. Nothing happens in the dark.'],
                  ].map(([cls, icon, title, desc], i) => (
                    <div key={i} className={`why-point reveal reveal-delay${(i % 3) + 1}`}>
                      <div className={`wp-icon ${cls}`}>{icon}</div>
                      <div><div className="wp-title">{title}</div><div className="wp-desc">{desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="why-visual reveal">
                <div className="vault-diagram">
                  <div className="vd-ring vd-ring3" /><div className="vd-ring vd-ring2" /><div className="vd-ring vd-ring1" />
                  <div className="vd-center">🔐</div>
                  <div className="vd-badge enc">ENCRYPT IN BROWSER</div><div className="vd-badge cipher">CIPHERTEXT ONLY →</div>
                  <div className="vd-node browser">🌐</div><span className="vd-label" style={{ top: '5%', left: '2%' }}>YOUR<br />BROWSER</span>
                  <div className="vd-node user">👤</div><span className="vd-label" style={{ top: '5%', right: '2%' }}>YOU<br />(KEY HOLDER)</span>
                  <div className="vd-node cloud">☁️</div><span className="vd-label" style={{ bottom: '15%', left: '2%' }}>SUPABASE<br />STORAGE</span>
                  <div className="vd-node db">🗄️</div><span className="vd-label" style={{ bottom: '15%', right: '2%' }}>POSTGRES<br />DB</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features-section" id="features">
          <div className="container">
            <div className="features-header">
              <div className="section-label reveal">What you get</div>
              <h2 className="section-title reveal reveal-delay1" style={{ textAlign: 'center' }}>Built for people who<br /><span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>actually care about privacy</span></h2>
            </div>
            <div className="features-grid">
              {[['v1', '📁', 'Encrypted File Vault', 'Drag-and-drop any file. AES-256 encrypted inside your browser, stored as ciphertext. Decrypt anytime, entirely offline.', 'core', 'CORE'],
              ['v2', '🔑', 'Password Vault', 'Store credentials — encrypted, masked, revealed only on demand. Copy to clipboard without showing the password on screen.', 'core', 'CORE'],
              ['v3', '🤖', 'AI Security Assistant', 'Claude reads your vault state and answers "was this login suspicious?" in plain language.', 'ai', 'AI-POWERED'],
              ['v4', '🌍', 'Login Map & Threats', 'Every sign-in is geolocated. New country logins and impossible travel trigger instant threat alerts.', 'new', 'NEW'],
              ['v5', '📋', 'Live Audit Log', 'Supabase Realtime pushes every UPLOAD, DOWNLOAD, DELETE and REVEAL to your screen instantly.', 'core', 'REALTIME'],
              ['v6', '👑', 'Admin Control Panel', 'Admin accounts see all activity. Role-based access enforced at the Supabase RLS layer — not just the app.', 'core', 'RBAC'],
              ].map(([v, icon, title, desc, tag, tagLabel], i) => (
                <div key={i} className={`feat-card reveal${i % 3 !== 0 ? ` reveal-delay${i % 3}` : ''}`}>
                  <div className={`feat-card-icon ${v}`}>{icon}</div>
                  <h3>{title}</h3><p>{desc}</p><span className={`feat-tag ${tag}`}>{tagLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FLOW */}
        <section className="flow-section" id="how">
          <div className="container">
            <div>
              <div className="section-label reveal">Under the hood</div>
              <h2 className="section-title reveal reveal-delay1" style={{ marginBottom: 12 }}>How your file<br />travels safely</h2>
              <p className="section-sub reveal reveal-delay2" style={{ marginBottom: 48 }}>Four steps. Zero plaintext ever touches the network.</p>
              <div className="flow-steps">
                {[['01', 'Select your file', 'Drag-and-drop or browse. The file loads into browser memory via FileReader — it hasn\'t moved yet.'],
                ['02', 'AES-256 encrypts in the browser', 'CryptoJS encrypts using AES-256 CBC. The result is unreadable ciphertext — still in your browser.'],
                ['03', 'Ciphertext uploads to Supabase', 'Only the encrypted string is sent over the network. The server sees chaos, not your file.'],
                ['04', 'Decrypt on demand, locally', 'Ciphertext is pulled from Supabase, decrypted entirely in your browser — never touching the server decrypted.'],
                ].map(([n, title, desc], i) => (
                  <div key={i} className={`flow-step reveal${i > 0 ? ` reveal-delay${i}` : ''}`}>
                    <div className="flow-num">{n}</div>
                    <div className="flow-content"><h4>{title}</h4><p>{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flow-code reveal reveal-delay1">
              <span className="code-comment">{'// 🔐 Upload flow — browser only'}</span><br /><br />
              <span className="code-key">const</span> <span className="code-val">dataUrl</span> = <span className="code-fn">await</span> readAsDataURL(<span className="code-str">file</span>);<br /><br />
              <span className="code-key">const</span> <span className="code-val">ciphertext</span> =<br />
              &nbsp;&nbsp;CryptoJS.AES.<span className="code-fn">encrypt</span>(<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="code-val">dataUrl</span>, <span className="code-str">SECRET_KEY</span><br />
              &nbsp;&nbsp;).<span className="code-fn">toString</span>();<br /><br />
              <span className="code-fn">await</span> supabase.from(<span className="code-str">{'\'files\''}</span>).<span className="code-fn">insert</span>({'({'}<br />
              &nbsp;&nbsp;encrypted_data: <span className="code-val">ciphertext</span>, <span className="code-comment">{'// ✓ only this'}</span><br />
              &nbsp;&nbsp;name: <span className="code-val">file.name</span>, size: <span className="code-val">file.size</span><br />
              {'}'});<br /><br />
              <span className="code-comment">{'// Server sees: 5qXp+K2mN3... ← unreadable'}</span><span className="code-cursor" />
            </div>
          </div>
        </section>

        {/* COMPARE */}
        <section className="compare-section" id="compare">
          <div className="container">
            <div className="compare-header">
              <div className="section-label reveal" style={{ justifyContent: 'center' }}>Why SecureVault</div>
              <h2 className="section-title reveal reveal-delay1" style={{ textAlign: 'center' }}>How we stack up</h2>
              <p className="section-sub reveal reveal-delay2" style={{ textAlign: 'center', margin: '0 auto' }}>Client-side encryption isn&apos;t a feature most vaults offer. It should be the default.</p>
            </div>
            <div className="compare-table-wrap reveal">
              <table className="compare-table">
                <thead><tr><th>Feature</th><th className="hl">🔐 SecureVault</th><th>Google Drive</th><th>Dropbox</th><th>LastPass</th></tr></thead>
                <tbody>
                  {[
                    ['Client-side encryption', <><span className="ck">✓</span> AES-256 in browser</>, <><span className="cx">✗</span> Server-side</>, <><span className="cx">✗</span> Server-side</>, <><span className="cp">◑</span> Passwords only</>],
                    ['Server sees plaintext', <><span className="ck">Never</span></>, <><span className="cx">✗</span> Always</>, <><span className="cx">✗</span> Always</>, <><span className="cp">◑</span> Partial</>],
                    ['File + password vault', <><span className="ck">✓</span> Both</>, 'Files only', 'Files only', 'Passwords only'],
                    ['AI security assistant', <><span className="ck">✓</span> Claude-powered</>, <><span className="cx">✗</span></>, <><span className="cx">✗</span></>, <><span className="cx">✗</span></>],
                    ['Login threat detection', <><span className="ck">✓</span> Geo + Haversine</>, <><span className="cp">◑</span> Basic</>, <><span className="cp">◑</span> Basic</>, <><span className="cp">◑</span> Basic</>],
                    ['Live audit log', <><span className="ck">✓</span> Realtime WS</>, <><span className="cp">◑</span> History</>, <><span className="cx">✗</span></>, <><span className="cp">◑</span> Limited</>],
                    ['Open architecture', <><span className="ck">✓</span> Self-hostable</>, <><span className="cx">✗</span> Closed</>, <><span className="cx">✗</span> Closed</>, <><span className="cx">✗</span> Closed</>],
                    ['Free tier', <><span className="ck">✓</span> Full features</>, <><span className="ck">✓</span> 15 GB</>, <><span className="cp">◑</span> 2 GB</>, <><span className="cp">◑</span> 1 device</>],
                  ].map(([feat, ...cols], i) => (
                    <tr key={i}><td>{feat}</td><td className="hl">{cols[0]}</td><td>{cols[1]}</td><td>{cols[2]}</td><td>{cols[3]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SCALE */}
        <section className="scale-section" id="scale">
          <div className="container">
            <div className="scale-header">
              <div className="section-label reveal" style={{ justifyContent: 'center' }}>Growth path</div>
              <h2 className="section-title reveal reveal-delay1" style={{ textAlign: 'center' }}>From student project<br /><span style={{ background: 'var(--grad2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>to production SaaS</span></h2>
              <p className="section-sub reveal reveal-delay2" style={{ textAlign: 'center', margin: '0 auto' }}>No rewrite needed. Each tier adds infra, not complexity.</p>
            </div>
            <div className="scale-tiers">
              {[
                { t: 't1', badge: 'TIER 1 — NOW', icon: '🎓', title: 'Student / Demo Tier', cost: '₹0 / month · Supabase Free + Vercel Hobby', desc: 'Fully functional with all features. Free tiers of every service — Supabase (500 MB DB), Vercel Hobby deploys, hCaptcha, ipapi.co (1000 req/day), Anthropic free credits.', chips: ['Supabase Free', 'Vercel Hobby', 'hCaptcha Free', 'ipapi.co Free', 'Anthropic Credits'], delay: '' },
                { t: 't2', badge: 'TIER 2 — SMALL LAUNCH', icon: '🚀', title: 'Early Users (~500 users)', cost: '~₹2,000–5,000 / month', desc: 'Supabase Pro ($25/mo) for 8 GB DB + 250 GB bandwidth. Migrate files to Supabase Storage (binary blobs, 33% smaller). Add Resend for threat email alerts.', chips: ['Supabase Pro', 'Supabase Storage', 'Resend Email', 'Vercel Pro', 'Upstash Redis'], delay: 'reveal-delay1' },
                { t: 't3', badge: 'TIER 3 — SCALE', icon: '⚡', title: 'Growth Stage (~10k users)', cost: '~₹15,000–40,000 / month', desc: 'PBKDF2 key derivation per user. AWS RDS / Neon read replicas. Cloudflare CDN + WAF. Sentry error monitoring. PostHog analytics. Supabase TOTP MFA.', chips: ['AWS RDS / Neon', 'Cloudflare WAF', 'Sentry', 'PostHog', 'PBKDF2 Keys', 'TOTP MFA'], delay: 'reveal-delay2' },
                { t: 't4', badge: 'TIER 4 — ENTERPRISE', icon: '🏢', title: 'Enterprise / SaaS (100k+ users)', cost: 'Custom · Stripe Billing + Team Plans', desc: 'Team vaults with org-scoped RLS. Key rotation on password change. Stripe billing. Kubernetes auto-scaling. Signed share URLs. SOC 2 + GDPR compliance exports.', chips: ['Stripe Billing', 'Team Vaults', 'Kubernetes/EKS', 'Key Rotation', 'Signed URLs', 'SOC 2 Export'], delay: '' },
              ].map(({ t, badge, icon, title, cost, desc, chips, delay }) => (
                <div key={t} className={`scale-tier reveal ${delay}`}>
                  <span className={`tier-badge ${t}`}>{badge}</span>
                  <div className={`tier-icon ${t}`}>{icon}</div>
                  <div className="tier-content">
                    <h3>{title}</h3><div className="tier-cost">{cost}</div><p>{desc}</p>
                    <div className="tier-stack">{chips.map(c => <span key={c} className="tier-chip">{c}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STUDENT */}
        <section className="student-note">
          <div className="container">
            <div className="student-card reveal">
              <div className="student-emoji">🎓</div>
              <div className="student-text">
                <h2>Built by a student. Free for everyone.</h2>
                <p>SecureVault uses the free tiers of every service it touches — AES-256, realtime WebSockets, AI assistant, geolocation threats — all running on infrastructure that costs exactly ₹0.</p>
                <div className="student-free-stack">
                  {['Supabase Free — 500 MB DB', 'Vercel Hobby — Unlimited deploys', 'hCaptcha — Free forever', 'ipapi.co — 1,000 req/day', 'Anthropic Free Credits', 'Next.js 16 — Open source'].map(c => <span key={c} className="free-chip">{c}</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="container">
            <h2 className="reveal">Your data deserves<br /><span style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--text2)' }}>real</span> encryption.</h2>
            <p className="reveal reveal-delay1">Not server-side. Not &ldquo;encrypted at rest.&rdquo; In your browser, before it moves. That&apos;s the only kind that matters.</p>
            <div className="cta-actions reveal reveal-delay2">
              <Link href="/register" className="btn-primary">🔐 Open Your Vault — it&apos;s free</Link>
              <Link href="/register" className="btn-ghost">Create account →</Link>
            </div>
            <div className="cta-mono reveal reveal-delay3">AES-256-CBC · crypto-js · Supabase RLS · Next.js 16 · Built at KL University</div>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-logo"><div className="footer-logo-icon">🔐</div>SecureVault</div>
          <div className="footer-links"><a href="#why">Why</a><a href="#features">Features</a><a href="#compare">Compare</a><a href="#scale">Scale</a><Link href="/register">Login</Link></div>
          <div className="footer-copy">Built with ♥ at KL University · Vaddeswaram</div>
        </footer>
      </div>
    </>
  );
}
