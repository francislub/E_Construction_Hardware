"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface StaffProfile {
  id: string;
  licenseNumber: string;
  vehicleType: string;
  available: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    createdAt: string;
  };
  _count: {
    deliveries: number;
  };
  deliveriesStats: {
    delivered: number;
    failed: number;
    total: number;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicleType: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/delivery/profile");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setProfile(data);
      setForm({
        name: data.user.name ?? "",
        phone: data.user.phone ?? "",
        vehicleType: data.vehicleType,
      });
    } catch {
      setError("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/delivery/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setProfile(updated);
      setEditing(false);
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability() {
    if (!profile) return;
    setToggling(true);
    try {
      const res = await fetch("/api/delivery/profile/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !profile.available }),
      });
      if (!res.ok) throw new Error("Failed");
      setProfile((prev) => prev ? { ...prev, available: !prev.available } : prev);
    } catch {
      setError("Failed to update availability.");
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="delivery-page">
        <div className="skeleton-list">
          <div className="skeleton-card tall" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="delivery-page">
        <div className="empty-state">
          <h3>Profile not found</h3>
          <p>Unable to load your profile. Please try again.</p>
          <button className="accept-btn" onClick={fetchProfile}>Retry</button>
        </div>
      </div>
    );
  }

  const successRate =
    profile.deliveriesStats.total > 0
      ? Math.round((profile.deliveriesStats.delivered / profile.deliveriesStats.total) * 100)
      : 0;

  return (
    <div className="delivery-page">
      <header className="page-header">
        <div className="header-left">
          <span className="page-tag">Account</span>
          <h1>My Profile</h1>
          <p className="header-sub">Delivery Staff Portal</p>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {success && (
        <div className="success-banner">
          <span>✓ {success}</span>
        </div>
      )}

      {/* Avatar + Identity */}
      <div className="profile-hero">
        <div className="profile-avatar">
          <span>{(profile.user.name ?? profile.user.email).charAt(0).toUpperCase()}</span>
        </div>
        <div className="profile-identity">
          <h2>{profile.user.name ?? "Unnamed Staff"}</h2>
          <span className="profile-email">{profile.user.email}</span>
          <span className="member-since">
            Member since {format(new Date(profile.user.createdAt), "MMMM yyyy")}
          </span>
        </div>
        <div className="availability-toggle-wrap">
          <span className="avail-label">Available</span>
          <button
            className={`availability-toggle ${profile.available ? "avail-on" : "avail-off"}`}
            onClick={toggleAvailability}
            disabled={toggling}
          >
            <span className="toggle-knob" />
          </button>
          <span className={`avail-status ${profile.available ? "text-green" : "text-muted"}`}>
            {profile.available ? "On Duty" : "Off Duty"}
          </span>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{profile.deliveriesStats.delivered}</span>
          <span className="stat-label">Delivered</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{profile.deliveriesStats.failed}</span>
          <span className="stat-label">Failed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{successRate}%</span>
          <span className="stat-label">Success Rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{profile.deliveriesStats.total}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      {/* Driver Info */}
      <div className="profile-section">
        <div className="section-header">
          <h3>Driver Information</h3>
          {!editing && (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="edit-form">
            <div className="form-field">
              <label>Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div className="form-field">
              <label>Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+256 700 000 000"
              />
            </div>
            <div className="form-field">
              <label>Vehicle Type</label>
              <select
                value={form.vehicleType}
                onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}
              >
                <option value="Motorcycle">Motorcycle (Boda Boda)</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Car">Car</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Tuktuk">Tuktuk</option>
              </select>
            </div>
            <div className="form-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setEditing(false);
                  setForm({
                    name: profile.user.name ?? "",
                    phone: profile.user.phone ?? "",
                    vehicleType: profile.vehicleType,
                  });
                }}
              >
                Cancel
              </button>
              <button className="save-btn" onClick={saveProfile} disabled={saving}>
                {saving ? <span className="btn-spinner" /> : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="info-grid">
            <div className="info-item">
              <span className="info-key">Phone</span>
              <span className="info-val">{profile.user.phone ?? "—"}</span>
            </div>
            <div className="info-item">
              <span className="info-key">Email</span>
              <span className="info-val">{profile.user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-key">License Number</span>
              <span className="info-val mono">{profile.licenseNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-key">Vehicle Type</span>
              <span className="info-val">{profile.vehicleType}</span>
            </div>
          </div>
        )}
      </div>

      {/* Success rate bar */}
      <div className="profile-section">
        <div className="section-header">
          <h3>Performance</h3>
        </div>
        <div className="perf-bar-wrap">
          <div className="perf-bar-labels">
            <span>Success Rate</span>
            <span className={successRate >= 80 ? "text-green" : successRate >= 50 ? "text-orange" : "text-red"}>
              {successRate}%
            </span>
          </div>
          <div className="perf-bar-track">
            <div
              className={`perf-bar-fill ${successRate >= 80 ? "fill-green" : successRate >= 50 ? "fill-orange" : "fill-red"}`}
              style={{ width: `${successRate}%` }}
            />
          </div>
          <p className="perf-hint">
            {successRate >= 90
              ? "🌟 Excellent performance! Keep it up."
              : successRate >= 70
              ? "👍 Good performance. Aim for above 90%."
              : "⚠️ Low success rate. Review failed deliveries."}
          </p>
        </div>
      </div>
    </div>
  );
}