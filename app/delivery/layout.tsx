"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  {
    href: "/delivery/dashboard",
    label: "Overview",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    accent: "#7c6af7",
  },
  {
    href: "/delivery/pending",
    label: "Pending",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
    ),
    accent: "#f0a500",
  },
  {
    href: "/delivery/active",
    label: "Active",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="1" y="3" width="15" height="13" rx="1.5" />
        <path d="M16 8l5 3-5 3V8z" />
        <line x1="1" y1="20" x2="23" y2="20" />
      </svg>
    ),
    accent: "#38bdf8",
  },
  {
    href: "/delivery/completed",
    label: "Completed",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    accent: "#34d399",
  },
  {
    href: "/delivery/profile",
    label: "Profile",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    accent: "#f472b6",
  },
];

const DELIVERY_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');

/* ── Tokens ─────────────────────────────────────────── */
:root {
  --bg:           #080c12;
  --bg-1:         #0e1420;
  --bg-2:         #141c2e;
  --bg-3:         #1a2438;
  --bg-hover:     #1f2d40;
  --border:       rgba(255,255,255,0.07);
  --border-soft:  rgba(255,255,255,0.04);
  --tx-1: #eef2f7;
  --tx-2: #8896aa;
  --tx-3: #4a5568;
  --accent-dash:      #7c6af7;
  --accent-pending:   #f0a500;
  --accent-active:    #38bdf8;
  --accent-completed: #34d399;
  --accent-profile:   #f472b6;
  --green:   #34d399;
  --red:     #f87171;
  --orange:  #fbbf24;
  --blue:    #60a5fa;
  --sb-w:        228px;
  --sb-w-col:     64px;
  --topbar-h:     52px;
  --bottom-nav-h: 60px;
  --radius-sm: 6px;
  --radius:    10px;
  --radius-lg: 16px;
  --shadow:    0 2px 8px rgba(0,0,0,0.5);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);
  --transition: 0.22s cubic-bezier(.4,0,.2,1);
  --font-display: 'Syne', sans-serif;
  --font-body:    'Outfit', sans-serif;
  --font-mono:    'DM Mono', monospace;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { height: 100%; }
body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--tx-1);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100%;
}
a { color: inherit; text-decoration: none; }
button { font-family: var(--font-body); cursor: pointer; border: none; background: none; }
input, select, textarea { font-family: var(--font-body); }
ul { list-style: none; }

/* ── Layout shell ───────────────────────────────────── */
.dlv-root { display: flex; min-height: 100vh; position: relative; }

/* Sidebar */
.dlv-sidebar {
  width: var(--sb-w);
  min-height: 100vh;
  background: var(--bg-1);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 60;
  transition: width var(--transition);
  overflow: hidden;
  will-change: width;
}
.sidebar-collapsed .dlv-sidebar { width: var(--sb-w-col); }
.sidebar-collapsed .dlv-body    { margin-left: var(--sb-w-col); }

/* Brand row */
.sb-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 60px;
  border-bottom: 1px solid var(--border-soft);
  flex-shrink: 0;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
}
.sb-logo {
  width: 34px; height: 34px;
  background: rgba(124,106,247,0.14);
  border: 1px solid rgba(124,106,247,0.28);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--accent-dash);
  flex-shrink: 0;
}
.sb-brand-name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--tx-1);
  letter-spacing: -0.02em;
  flex: 1;
  overflow: hidden;
}
.sb-collapse-btn {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--tx-3);
  transition: background var(--transition), color var(--transition);
  flex-shrink: 0;
  margin-left: auto;
}
.sb-collapse-btn:hover { background: var(--bg-hover); color: var(--tx-1); }
.sidebar-collapsed .sb-collapse-btn { margin-left: 0; }

/* Nav */
.sb-nav {
  flex: 1;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}
.sb-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  color: var(--tx-2);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  position: relative;
  transition: background var(--transition), color var(--transition);
  overflow: hidden;
}
.sb-link:hover { background: var(--bg-hover); color: var(--tx-1); }
.sb-link-active {
  background: color-mix(in srgb, var(--link-accent) 12%, transparent);
  color: var(--link-accent) !important;
}
.sb-link-icon {
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; width: 20px; height: 20px;
}
.sb-link-label { flex: 1; overflow: hidden; }
.sb-active-bar {
  position: absolute;
  right: 0; top: 20%; bottom: 20%;
  width: 3px;
  border-radius: 3px 0 0 3px;
  background: var(--link-accent);
}

/* Footer + logout */
.sb-footer {
  padding: 14px 10px;
  border-top: 1px solid var(--border-soft);
  white-space: nowrap;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sb-footer-text { font-size: 0.68rem; color: var(--tx-3); letter-spacing: 0.04em; padding: 0 6px; }
.logout-btn {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  color: var(--tx-2);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  width: 100%;
  text-align: left;
  transition: background var(--transition), color var(--transition);
  cursor: pointer;
  border: none;
  background: none;
  font-family: var(--font-body);
}
.logout-btn:hover {
  background: rgba(248,113,113,0.08);
  color: var(--red);
}
.logout-btn-icon {
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; width: 20px; height: 20px;
}
.logout-btn-label { flex: 1; overflow: hidden; }

/* Topbar logout */
.topbar-logout-btn {
  margin-left: auto;
  display: flex; align-items: center; gap: 5px;
  background: rgba(248,113,113,0.08);
  border: 1px solid rgba(248,113,113,0.2);
  border-radius: var(--radius-sm);
  padding: 5px 11px;
  font-size: 0.72rem; font-weight: 600;
  color: var(--red);
  transition: background var(--transition), border-color var(--transition);
  cursor: pointer;
  font-family: var(--font-body);
}
.topbar-logout-btn:hover {
  background: rgba(248,113,113,0.15);
  border-color: rgba(248,113,113,0.4);
}

/* Body */
.dlv-body {
  flex: 1;
  margin-left: var(--sb-w);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left var(--transition);
}

/* Topbar (mobile) */
.dlv-topbar {
  display: none;
  align-items: center;
  gap: 12px;
  height: var(--topbar-h);
  padding: 0 16px;
  background: var(--bg-1);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 40;
}
.topbar-menu-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--tx-2);
  transition: background var(--transition);
}
.topbar-menu-btn:hover { background: var(--bg-hover); }
.topbar-brand {
  display: flex; align-items: center; gap: 7px;
  font-family: var(--font-display);
  font-weight: 800; font-size: 1rem; color: var(--tx-1);
}
.topbar-page {
  font-size: 0.75rem; font-weight: 600;
  letter-spacing: 0.04em; opacity: 0.85;
}

/* Main */
.dlv-main {
  flex: 1;
  padding: 28px 28px 80px;
  max-width: 1140px;
  width: 100%;
}

/* Bottom nav (mobile) */
.dlv-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: var(--bottom-nav-h);
  background: var(--bg-1);
  border-top: 1px solid var(--border);
  z-index: 50;
  justify-content: space-around;
  align-items: center;
  padding: 0 4px;
}
.bnav-link {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  color: var(--tx-3);
  font-size: 0.65rem; font-weight: 500;
  transition: color var(--transition);
  flex: 1; text-align: center;
}
.bnav-icon { display: flex; align-items: center; justify-content: center; }
.bnav-active { color: var(--link-accent) !important; }

/* Mobile overlay */
.mobile-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(2px);
  z-index: 55;
}

/* ── Page shell ─────────────────────────────────────── */
.delivery-page { display: flex; flex-direction: column; gap: 0; }
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 24px; gap: 12px;
}
.header-left { display: flex; flex-direction: column; gap: 3px; }
.page-tag {
  font-size: 0.63rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 2px 9px; border-radius: 20px;
  width: fit-content; margin-bottom: 4px;
}
.page-tag-violet  { background: rgba(124,106,247,0.15); color: var(--accent-dash); }
.page-tag-amber   { background: rgba(240,165,0,0.15);   color: var(--accent-pending); }
.page-tag-sky     { background: rgba(56,189,248,0.15);  color: var(--accent-active); }
.page-tag-emerald { background: rgba(52,211,153,0.15);  color: var(--accent-completed); }
.page-tag-pink    { background: rgba(244,114,182,0.15); color: var(--accent-profile); }
.page-header h1 {
  font-family: var(--font-display);
  font-size: 1.65rem; font-weight: 800;
  letter-spacing: -0.03em; color: var(--tx-1); line-height: 1.1;
}
.header-sub { font-size: 0.8rem; color: var(--tx-2); }
.refresh-btn {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 8px; color: var(--tx-2);
  display: flex; transition: all var(--transition);
}
.refresh-btn:hover { color: var(--tx-1); background: var(--bg-hover); border-color: rgba(255,255,255,0.15); }

/* ── Stat cards ─────────────────────────────────────── */
.stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin-bottom: 20px;
}
.stat-card {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 18px 20px;
  display: flex; flex-direction: column; gap: 5px;
  position: relative; overflow: hidden;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.stat-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--stat-accent, #7c6af7) 50%, transparent);
}
.stat-card:hover { border-color: rgba(255,255,255,0.12); box-shadow: var(--shadow); }
.stat-card.wide { grid-column: span 2; }
.stat-value {
  font-family: var(--font-display); font-size: 2rem; font-weight: 800;
  color: var(--stat-accent, var(--accent-dash)); letter-spacing: -0.04em; line-height: 1;
}
.stat-label { font-size: 0.68rem; font-weight: 600; color: var(--tx-3); text-transform: uppercase; letter-spacing: 0.1em; }
.stat-sub { font-size: 0.72rem; color: var(--tx-2); }

/* ── Dashboard ──────────────────────────────────────── */
.dash-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 32px; gap: 16px; flex-wrap: wrap;
}
.dash-title-block { display: flex; flex-direction: column; gap: 4px; }
.dash-eyebrow {
  font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--tx-3); font-weight: 600;
}
.dash-title {
  font-family: var(--font-display); font-size: 2.1rem; font-weight: 800;
  letter-spacing: -0.03em; color: var(--tx-1); line-height: 1;
}
.dash-greeting { font-size: 0.78rem; color: var(--tx-2); margin-top: 3px; }
.dash-clock { text-align: right; display: flex; flex-direction: column; gap: 3px; }
.dash-time {
  font-family: var(--font-mono); font-size: 1.5rem; font-weight: 300;
  color: var(--accent-pending); letter-spacing: 0.04em; line-height: 1;
}
.dash-date { font-size: 0.65rem; color: var(--tx-3); }
.dash-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.dash-mid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.dash-card {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px 22px;
  position: relative; overflow: hidden;
}
.dash-card-label {
  font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.16em; color: var(--tx-3); margin-bottom: 16px;
}
.comp-rate-num {
  font-family: var(--font-display); font-size: 2.8rem; font-weight: 800;
  letter-spacing: -0.04em; color: var(--accent-completed); line-height: 1;
}
.comp-rate-sub { font-size: 0.68rem; color: var(--tx-2); margin: 5px 0 14px; }
.comp-bar-track {
  height: 5px; background: rgba(255,255,255,0.06);
  border-radius: 3px; overflow: hidden; margin-bottom: 8px;
}
.comp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-completed), #6ee7b7);
  border-radius: 3px; transition: width 1.2s cubic-bezier(.4,0,.2,1);
}
.comp-failed-note { font-size: 0.65rem; color: var(--red); display: flex; align-items: center; gap: 5px; }
.breakdown-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 0; border-bottom: 1px solid var(--border-soft);
}
.breakdown-row:last-child { border-bottom: none; }
.breakdown-label-wrap { display: flex; align-items: center; gap: 8px; }
.breakdown-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.breakdown-label { font-size: 0.78rem; color: var(--tx-2); }
.breakdown-val { font-size: 0.88rem; font-weight: 700; }
.dash-quick { margin-bottom: 16px; }
.section-label {
  font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.16em; color: var(--tx-3); margin-bottom: 12px;
}
.quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.quick-card {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 18px 16px;
  display: flex; flex-direction: column; gap: 6px;
  transition: all var(--transition); position: relative; overflow: hidden;
}
.quick-card::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: var(--qcard-accent, var(--accent-dash));
  transform: scaleX(0); transform-origin: left; transition: transform var(--transition);
}
.quick-card:hover { background: var(--bg-3); border-color: rgba(255,255,255,0.1); transform: translateY(-2px); box-shadow: var(--shadow); }
.quick-card:hover::after { transform: scaleX(1); }
.quick-icon { color: var(--qcard-accent, var(--accent-dash)); opacity: 0.7; display: flex; align-items: center; margin-bottom: 2px; }
.quick-title { font-size: 0.9rem; font-weight: 600; color: var(--tx-1); }
.quick-sub { font-size: 0.68rem; color: var(--tx-3); }
.recent-section { }
.recent-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.view-all-link {
  font-size: 0.68rem; color: var(--accent-completed); font-weight: 600;
  letter-spacing: 0.06em; opacity: 0.7; transition: opacity var(--transition);
}
.view-all-link:hover { opacity: 1; }
.recent-table {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); overflow: hidden;
}
.recent-thead {
  display: grid; grid-template-columns: 1fr 1.6fr 1fr 0.8fr;
  padding: 10px 18px; border-bottom: 1px solid var(--border-soft);
}
.recent-th { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--tx-3); }
.recent-row {
  display: grid; grid-template-columns: 1fr 1.6fr 1fr 0.8fr;
  padding: 13px 18px; border-bottom: 1px solid var(--border-soft);
  align-items: center; transition: background var(--transition);
}
.recent-row:last-child { border-bottom: none; }
.recent-row:hover { background: var(--bg-hover); }
.recent-order { font-size: 0.78rem; font-weight: 700; color: var(--accent-pending); font-family: var(--font-mono); }
.recent-customer { font-size: 0.78rem; color: var(--tx-1); }
.recent-addr { font-size: 0.65rem; color: var(--tx-3); margin-top: 1px; }
.recent-date { font-size: 0.68rem; color: var(--tx-3); }
.dash-loading {
  display: flex; align-items: center; gap: 10px; padding: 40px 0;
  color: var(--tx-3); font-size: 0.75rem; letter-spacing: 0.15em; text-transform: uppercase;
}
.dash-loading-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--accent-dash); animation: pulse 1.2s ease-in-out infinite;
}
.dash-loading-dot:nth-child(2) { animation-delay: 0.2s; }
.dash-loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse { 0%,100% { opacity:0.2; transform:scale(0.8); } 50% { opacity:1; transform:scale(1); } }

/* ── Status badges ──────────────────────────────────── */
.status-chip {
  display: inline-flex; align-items: center;
  font-size: 0.62rem; font-weight: 700;
  padding: 3px 9px; border-radius: 20px;
  letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
}
.s-pending    { background: rgba(240,165,0,0.12);   color: var(--accent-pending);   border: 1px solid rgba(240,165,0,0.25); }
.s-assigned   { background: rgba(124,106,247,0.12); color: var(--accent-dash);      border: 1px solid rgba(124,106,247,0.25); }
.s-picked-up  { background: rgba(56,189,248,0.12);  color: var(--accent-active);    border: 1px solid rgba(56,189,248,0.25); }
.s-in-transit { background: rgba(96,165,250,0.12);  color: var(--blue);             border: 1px solid rgba(96,165,250,0.25); }
.s-delivered  { background: rgba(52,211,153,0.12);  color: var(--accent-completed); border: 1px solid rgba(52,211,153,0.25); }
.s-failed     { background: rgba(248,113,113,0.12); color: var(--red);              border: 1px solid rgba(248,113,113,0.25); }

/* ── Delivery cards ─────────────────────────────────── */
.delivery-list { display: flex; flex-direction: column; gap: 12px; }
.delivery-card {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 18px 20px;
  display: flex; flex-direction: column; gap: 12px;
  transition: box-shadow var(--transition), border-color var(--transition);
}
.delivery-card:hover { border-color: rgba(255,255,255,0.1); box-shadow: var(--shadow); }
.pending-card   { border-left: 3px solid var(--accent-pending); }
.active-card    { border-left: 3px solid var(--accent-active); }
.completed-card { border-left: 3px solid var(--accent-completed); }
.failed-card    { border-left: 3px solid var(--red); }
.card-top { display: flex; align-items: center; justify-content: space-between; }
.order-meta { display: flex; align-items: center; gap: 8px; }
.order-number { font-family: var(--font-mono); font-weight: 500; font-size: 0.88rem; color: var(--tx-1); }
.time-ago { font-size: 0.7rem; color: var(--tx-3); }
.expand-btn { background: none; border: none; color: var(--tx-3); font-size: 0.65rem; padding: 4px; }
.card-body { display: flex; flex-direction: column; gap: 7px; }
.info-row { display: flex; align-items: center; gap: 7px; font-size: 0.82rem; color: var(--tx-2); }
.info-row svg { color: var(--tx-3); flex-shrink: 0; }
.address { color: var(--tx-1); font-size: 0.82rem; line-height: 1.4; }
.phone-link {
  margin-left: auto; display: flex; align-items: center; gap: 4px;
  background: rgba(240,165,0,0.1); border: 1px solid rgba(240,165,0,0.22);
  border-radius: 20px; padding: 3px 10px;
  font-size: 0.72rem; font-weight: 600; color: var(--accent-pending);
  transition: background var(--transition);
}
.phone-link:hover { background: rgba(240,165,0,0.18); }
.items-summary { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
.item-pill {
  font-size: 0.7rem; padding: 2px 9px;
  background: var(--bg-3); border: 1px solid var(--border);
  border-radius: 20px; color: var(--tx-2);
}
.item-pill-more { color: var(--tx-3); }
.card-footer {
  display: flex; align-items: center; gap: 10px;
  padding-top: 10px; border-top: 1px solid var(--border-soft);
}
.order-total { font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--tx-1); }
.est-date { font-size: 0.72rem; color: var(--tx-3); }
.date-row { display: flex; gap: 14px; font-size: 0.72rem; color: var(--tx-3); margin-top: 2px; }
.accept-btn, .next-status-btn, .save-btn {
  margin-left: auto; border: none; border-radius: var(--radius-sm);
  padding: 8px 20px; font-size: 0.78rem; font-weight: 700;
  font-family: var(--font-display); letter-spacing: 0.02em;
  display: flex; align-items: center; gap: 6px; justify-content: center;
  min-width: 90px; transition: filter var(--transition), transform var(--transition); cursor: pointer;
}
.accept-btn      { background: var(--accent-pending);   color: #000; }
.next-status-btn { background: var(--accent-active);    color: #000; }
.deliver-btn     { background: var(--accent-completed); color: #000; }
.accept-btn:hover, .next-status-btn:hover, .deliver-btn:hover { filter: brightness(1.12); }
.accept-btn:disabled, .next-status-btn:disabled, .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.cancel-btn {
  background: var(--bg-3); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 8px 16px;
  font-size: 0.78rem; font-weight: 600; color: var(--tx-2);
  transition: background var(--transition);
}
.cancel-btn:hover { background: var(--bg-hover); }
.edit-btn {
  display: flex; align-items: center; gap: 5px;
  background: var(--bg-3); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 6px 13px;
  font-size: 0.75rem; font-weight: 600; color: var(--tx-2);
  transition: all var(--transition);
}
.edit-btn:hover { color: var(--accent-profile); border-color: rgba(244,114,182,0.4); }
.save-btn { background: var(--accent-profile); color: #fff; margin-left: 0; }
.btn-spinner {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(0,0,0,0.25); border-top-color: #000;
  border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Progress stepper ───────────────────────────────── */
.progress-stepper { display: flex; align-items: flex-start; padding: 6px 0; }
.step-item { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
.step-dot {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--bg-3); border: 2px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.62rem; font-weight: 700; color: var(--tx-3);
  z-index: 1; transition: all var(--transition);
}
.step-done { background: var(--accent-active); border-color: var(--accent-active); color: #000; }
.step-line {
  position: absolute; top: 12px; left: 50%; right: -50%;
  height: 2px; background: var(--border); z-index: 0;
}
.line-done { background: var(--accent-active); }
.step-label { font-size: 0.62rem; color: var(--tx-3); margin-top: 5px; text-align: center; white-space: nowrap; }

/* ── Expanded section ───────────────────────────────── */
.expanded-section {
  padding-top: 10px; border-top: 1px solid var(--border-soft);
  display: flex; flex-direction: column; gap: 12px;
  animation: fadeUp 0.15s ease both;
}
@keyframes fadeUp { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
.items-list { display: flex; flex-direction: column; gap: 3px; }
.items-label, .notes-label {
  font-size: 0.62rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em; color: var(--tx-3); margin-bottom: 5px;
}
.item-row {
  display: flex; align-items: center; gap: 12px;
  font-size: 0.8rem; color: var(--tx-2); padding: 4px 0;
  border-bottom: 1px solid var(--border-soft);
}
.item-row:last-child { border-bottom: none; }
.item-row span:last-child { margin-left: auto; color: var(--tx-1); font-weight: 600; }
.location-input-wrap { display: flex; flex-direction: column; gap: 4px; }
.location-input-wrap label { font-size: 0.72rem; font-weight: 600; color: var(--tx-2); }
.location-input {
  background: var(--bg-3); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 8px 12px;
  font-size: 0.82rem; color: var(--tx-1); outline: none;
  transition: border-color var(--transition);
}
.location-input:focus { border-color: var(--accent-active); }
.location-input::placeholder { color: var(--tx-3); }
.delivery-note-text, .delivery-notes p { font-size: 0.8rem; color: var(--tx-2); }

/* ── Filters bar ────────────────────────────────────── */
.filters-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.filter-tabs {
  display: flex; gap: 3px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 3px;
}
.filter-tab {
  background: none; border: none; padding: 5px 14px;
  border-radius: 4px; font-size: 0.78rem; font-weight: 600;
  color: var(--tx-2); transition: all var(--transition); cursor: pointer;
}
.filter-tab.active { background: var(--accent-completed); color: #000; }
.search-wrap {
  flex: 1; min-width: 180px; display: flex; align-items: center; gap: 8px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 7px 12px; color: var(--tx-3);
  transition: border-color var(--transition);
}
.search-wrap:focus-within { border-color: rgba(255,255,255,0.15); }
.search-input { background: none; border: none; outline: none; color: var(--tx-1); font-size: 0.82rem; width: 100%; }
.search-input::placeholder { color: var(--tx-3); }

/* ── Pagination ─────────────────────────────────────── */
.pagination { display: flex; align-items: center; justify-content: center; gap: 5px; margin-top: 24px; }
.page-btn {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 6px 12px;
  font-size: 0.8rem; color: var(--tx-2); min-width: 36px;
  transition: all var(--transition); cursor: pointer;
}
.page-btn:hover { border-color: rgba(255,255,255,0.15); color: var(--tx-1); }
.page-btn.active { background: var(--accent-completed); color: #000; font-weight: 700; border-color: var(--accent-completed); }
.page-btn:disabled { opacity: 0.3; cursor: default; }

/* ── Profile page ───────────────────────────────────── */
.profile-hero {
  display: flex; align-items: flex-start; gap: 20px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 24px;
  margin-bottom: 20px; flex-wrap: wrap;
  border-left: 3px solid var(--accent-profile);
}
.profile-avatar {
  width: 60px; height: 60px; border-radius: 50%;
  background: rgba(244,114,182,0.12); border: 2px solid rgba(244,114,182,0.3);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;
  color: var(--accent-profile); flex-shrink: 0;
}
.profile-identity { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.profile-identity h2 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; letter-spacing: -0.02em; }
.profile-email { font-size: 0.8rem; color: var(--tx-2); }
.member-since { font-size: 0.7rem; color: var(--tx-3); }
.availability-toggle-wrap { display: flex; flex-direction: column; align-items: center; gap: 5px; margin-left: auto; }
.avail-label { font-size: 0.65rem; color: var(--tx-3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.avail-status { font-size: 0.72rem; font-weight: 600; }
.text-green { color: var(--green); }
.text-muted { color: var(--tx-3); }
.availability-toggle {
  width: 46px; height: 24px; border-radius: 99px; border: 1px solid var(--border);
  background: var(--bg-3); position: relative;
  transition: background var(--transition), border-color var(--transition); cursor: pointer;
}
.availability-toggle.avail-on { background: var(--green); border-color: var(--green); }
.toggle-knob {
  position: absolute; top: 3px; left: 3px; width: 16px; height: 16px;
  border-radius: 50%; background: #fff; transition: transform var(--transition);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.avail-on .toggle-knob { transform: translateX(22px); }
.profile-section {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px; margin-bottom: 14px;
}
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-header h3 { font-family: var(--font-display); font-size: 0.92rem; font-weight: 700; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.info-item { display: flex; flex-direction: column; gap: 3px; }
.info-key { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--tx-3); }
.info-val { font-size: 0.86rem; color: var(--tx-1); font-weight: 500; }
.mono { font-family: var(--font-mono); font-size: 0.8rem; }
.edit-form { display: flex; flex-direction: column; gap: 14px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-field label { font-size: 0.75rem; font-weight: 600; color: var(--tx-2); }
.form-field input, .form-field select {
  background: var(--bg-3); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 9px 12px;
  font-size: 0.84rem; color: var(--tx-1); outline: none;
  transition: border-color var(--transition);
}
.form-field input:focus, .form-field select:focus { border-color: var(--accent-profile); }
.form-field select option { background: var(--bg-2); }
.form-actions { display: flex; gap: 10px; justify-content: flex-end; }
.perf-bar-wrap { display: flex; flex-direction: column; gap: 9px; }
.perf-bar-labels { display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 600; }
.perf-bar-track { height: 7px; background: var(--bg-3); border-radius: 99px; overflow: hidden; }
.perf-bar-fill { height: 100%; border-radius: 99px; transition: width 0.8s cubic-bezier(.4,0,.2,1); }
.fill-green  { background: linear-gradient(90deg, var(--green), #6ee7b7); }
.fill-orange { background: linear-gradient(90deg, var(--orange), #fde68a); }
.fill-red    { background: linear-gradient(90deg, var(--red), #fca5a5); }
.perf-hint { font-size: 0.78rem; color: var(--tx-2); }

/* ── Banners ────────────────────────────────────────── */
.error-banner {
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3);
  border-radius: var(--radius-sm); padding: 10px 14px;
  margin-bottom: 16px; font-size: 0.82rem; color: var(--red);
}
.error-banner button { background: none; border: none; color: var(--red); font-size: 1rem; cursor: pointer; }
.success-banner {
  background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3);
  border-radius: var(--radius-sm); padding: 10px 14px;
  margin-bottom: 16px; font-size: 0.82rem; color: var(--accent-completed);
}

/* ── Empty state ────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 64px 24px; text-align: center;
}
.empty-icon {
  width: 68px; height: 68px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--tx-3);
}
.empty-state h3 { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; color: var(--tx-1); }
.empty-state p  { font-size: 0.82rem; color: var(--tx-2); }

/* ── Skeleton ───────────────────────────────────────── */
.skeleton-list { display: flex; flex-direction: column; gap: 12px; }
.skeleton-card {
  background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
  border-radius: var(--radius); height: 110px; border: 1px solid var(--border);
}
.skeleton-card.tall { height: 190px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Fade-in ────────────────────────────────────────── */
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
.fade-in-1 { animation-delay: 0.05s; }
.fade-in-2 { animation-delay: 0.10s; }
.fade-in-3 { animation-delay: 0.15s; }
.fade-in-4 { animation-delay: 0.20s; }

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 1024px) {
  .dash-stats, .stats-row { grid-template-columns: repeat(2, 1fr); }
  .stat-card.wide { grid-column: span 2; }
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .dlv-sidebar { transform: translateX(-100%); transition: transform var(--transition); box-shadow: none; }
  .dlv-sidebar.mobile-open { transform: translateX(0); box-shadow: var(--shadow-lg); }
  .sidebar-collapsed .dlv-sidebar { transform: translateX(-100%); }
  .sb-collapse-btn { display: none; }
  .dlv-body { margin-left: 0 !important; }
  .dlv-topbar { display: flex; }
  .dlv-bottom-nav { display: flex; }
  .dlv-main { padding: 20px 14px 72px; }
  .dash-header { flex-direction: column; gap: 10px; }
  .dash-clock { text-align: left; }
  .dash-stats, .stats-row { grid-template-columns: 1fr 1fr; }
  .stat-card.wide { grid-column: span 2; }
  .dash-mid { grid-template-columns: 1fr; }
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
  .recent-thead, .recent-row { grid-template-columns: 1fr 1.4fr 1fr; }
  .recent-row > div:last-child, .recent-thead > div:last-child { display: none; }
  .profile-hero { flex-direction: column; }
  .availability-toggle-wrap { margin-left: 0; flex-direction: row; align-items: center; gap: 10px; }
  .info-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .dash-stats, .stats-row { grid-template-columns: 1fr; }
  .stat-card.wide { grid-column: span 1; }
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
  .dash-title { font-size: 1.6rem; }
}
`;

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  function handleLogout() {
    // Clear any auth tokens / session data here
    // e.g. localStorage.removeItem("auth-token");
    //      await signOut();  ← if using NextAuth or similar
    router.push("/auth/login");
  }

  const activeLink = NAV_LINKS.find((l) => l.href === pathname);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DELIVERY_STYLES }} />

      <div className={`dlv-root ${collapsed ? "sidebar-collapsed" : ""}`}>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside className={`dlv-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
          <div className="sb-brand">
            <div className="sb-logo">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" rx="1.5" />
                <path d="M16 8l5 3-5 3V8z" />
                <line x1="1" y1="20" x2="23" y2="20" />
              </svg>
            </div>
            {!collapsed && <span className="sb-brand-name">Deliver</span>}
            <button
              className="sb-collapse-btn"
              onClick={toggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                width="15" height="15"
                fill="none" stroke="currentColor" strokeWidth="2"
                viewBox="0 0 24 24"
                style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>

          <nav className="sb-nav">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`sb-link ${isActive ? "sb-link-active" : ""}`}
                  style={{ "--link-accent": link.accent } as React.CSSProperties}
                  title={collapsed ? link.label : undefined}
                >
                  <span className="sb-link-icon">{link.icon}</span>
                  {!collapsed && <span className="sb-link-label">{link.label}</span>}
                  {isActive && <span className="sb-active-bar" />}
                </Link>
              );
            })}
          </nav>

          <div className="sb-footer">
            {!collapsed && (
              <span className="sb-footer-text">Delivery Portal v1.0</span>
            )}
            <button
              className="logout-btn"
              onClick={handleLogout}
              title={collapsed ? "Log out" : undefined}
              aria-label="Log out"
            >
              <span className="logout-btn-icon">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              {!collapsed && <span className="logout-btn-label">Log out</span>}
            </button>
          </div>
        </aside>

        {/* Main body */}
        <div className="dlv-body">
          {/* Mobile topbar */}
          <header className="dlv-topbar">
            <button
              className="topbar-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="topbar-brand">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" rx="1.5" />
                <path d="M16 8l5 3-5 3V8z" />
                <line x1="1" y1="20" x2="23" y2="20" />
              </svg>
              <span>Deliver</span>
            </div>
            {activeLink && (
              <span className="topbar-page" style={{ color: activeLink.accent }}>
                {activeLink.label}
              </span>
            )}
            {/* Logout button in mobile topbar */}
            <button
              className="topbar-logout-btn"
              onClick={handleLogout}
              aria-label="Log out"
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </header>

          <main className="dlv-main">{children}</main>

          {/* Mobile bottom nav */}
          <nav className="dlv-bottom-nav">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`bnav-link ${isActive ? "bnav-active" : ""}`}
                  style={{ "--link-accent": link.accent } as React.CSSProperties}
                >
                  <span className="bnav-icon">{link.icon}</span>
                  <span className="bnav-label">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}