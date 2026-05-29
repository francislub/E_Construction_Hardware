"use client";
import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Review {
  id: string;
  rating: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sku: string;
  stock: number;
  images: string[];
  category: Category;
  reviews: Review[];
  createdAt: string;
}

interface ApiResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Static data ──────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 1,
    title: "Power Tools",
    subtitle: "Professional Grade",
    tag: "New Arrivals",
    bg: "linear-gradient(135deg, #1a2744 0%, #0f3460 100%)",
    emoji: "🔨",
    img: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
    alt: "Power drill on workbench",
  },
  {
    id: 2,
    title: "Electrical",
    subtitle: "Safe & Certified",
    tag: "Best Sellers",
    bg: "linear-gradient(135deg, #0c1a2e 0%, #1a3a5c 100%)",
    emoji: "⚡",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    alt: "Electrical wiring components",
  },
  {
    id: 3,
    title: "Plumbing",
    subtitle: "Leak-Proof Quality",
    tag: "Top Rated",
    bg: "linear-gradient(135deg, #0a1628 0%, #0d2d4a 100%)",
    emoji: "🚿",
    img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
    alt: "Plumbing pipes and fittings",
  },
  {
    id: 4,
    title: "Safety Gear",
    subtitle: "Protect Every Build",
    tag: "Essential",
    bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    emoji: "🦺",
    img: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&q=80",
    alt: "Construction safety equipment",
  },
];

const CATEGORIES = [
  { name: "Power Tools",  slug: "power-tools",  count: 284, emoji: "🔧", color: "#2563eb", bg: "#eff6ff",  border: "#bfdbfe" },
  { name: "Electrical",   slug: "electrical",   count: 156, emoji: "⚡", color: "#d97706", bg: "#fffbeb",  border: "#fde68a" },
  { name: "Plumbing",     slug: "plumbing",     count: 203, emoji: "🚿", color: "#0891b2", bg: "#ecfeff",  border: "#a5f3fc" },
  { name: "Paint & Finish",slug:"paint-finish", count: 118, emoji: "🎨", color: "#7c3aed", bg: "#f5f3ff",  border: "#ddd6fe" },
  { name: "Fasteners",    slug: "fasteners",    count: 342, emoji: "🔩", color: "#059669", bg: "#ecfdf5",  border: "#a7f3d0" },
  { name: "Safety Gear",  slug: "safety-gear",  count: 97,  emoji: "🦺", color: "#dc2626", bg: "#fef2f2",  border: "#fecaca" },
];

const TRUST = [
  { icon: "🚚", title: "Same-Day Delivery",  desc: "Across Kampala & nearby towns" },
  { icon: "✅", title: "100% Authentic",      desc: "Every product quality-verified" },
  { icon: "🎧", title: "Expert Support",      desc: "Hardware specialists Mon–Sat" },
  { icon: "💰", title: "Price Match",         desc: "Found it cheaper? We'll match it" },
];

// ─── API helper ───────────────────────────────────────────────────────────────
async function fetchFeaturedProducts(limit = 8): Promise<Product[]> {
  const params = new URLSearchParams({
    page:   "1",
    limit:  String(limit),
    sortBy: "newest",
  });

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // The API returns { data: Product[], pagination: {...} }
  const json: ApiResponse = await res.json();
  return json.data;
}

// ─── Utility: average rating ──────────────────────────────────────────────────
function avgRating(reviews: Review[]): number {
  if (!reviews.length) return 5;
  return Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length);
}

// ─── HeroCarousel ─────────────────────────────────────────────────────────────
function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number, dir: "next" | "prev" = "next") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 400);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDirection("next");
      setAnimating(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % SLIDES.length);
        setAnimating(false);
      }, 400);
    }, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const slide = SLIDES[current];

  return (
    <section style={{
      position: "relative", minHeight: "92vh",
      background: slide.bg, transition: "background 0.6s ease",
      overflow: "hidden", display: "flex", alignItems: "center",
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(37,99,235,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.06) 1px,transparent 1px)",
        backgroundSize: "64px 64px",
      }} />
      <div style={{ position: "absolute", top: "20%", left: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, right: "20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.14) 0%,transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 1200, margin: "0 auto", padding: "120px 24px 100px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        {/* LEFT */}
        <div style={{ opacity: animating ? 0 : 1, transform: animating ? (direction === "next" ? "translateX(-30px)" : "translateX(30px)") : "translateX(0)", transition: "opacity 0.4s ease, transform 0.4s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 50, padding: "6px 16px", marginBottom: 24 }}>
            <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em" }}>⚡ Uganda's #1 Hardware Destination</span>
          </div>
          <h1 style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: "clamp(3rem,6vw,5rem)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 20 }}>
            Build{" "}<span style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Better.</span>
            <br />Build{" "}<span style={{ background: "linear-gradient(135deg,#60a5fa,#3b82f6,#2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Smarter.</span>
          </h1>
          <p style={{ color: "rgba(200,215,240,0.75)", fontSize: 16, lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
            Premium hardware, tools & construction materials — delivered fast. Trusted by contractors, builders & DIY enthusiasts across Uganda.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
            <a href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 12, background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#111", fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 24px rgba(245,158,11,0.4)" }}>Shop All Products →</a>
            <a href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontWeight: 600, fontSize: 15, textDecoration: "none", backdropFilter: "blur(12px)" }}>Talk to an Expert</a>
          </div>
          <div style={{ display: "flex", gap: 36, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 28 }}>
            {[["10K+","Products"],["50K+","Customers"],["4.9★","Rating"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 12, color: "rgba(148,163,184,0.8)", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div style={{ position: "relative", height: 480 }}>
          <div style={{ position: "absolute", inset: 0, opacity: animating ? 0 : 1, transform: animating ? (direction === "next" ? "translateX(40px) scale(0.97)" : "translateX(-40px) scale(0.97)") : "translateX(0) scale(1)", transition: "opacity 0.4s ease, transform 0.4s ease" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 24, overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
              <img src={slide.img} alt={slide.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(6,8,20,0.7) 0%,transparent 60%)" }} />
              <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(245,158,11,0.9)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "6px 14px", color: "#111", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>{slide.tag}</div>
              <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>{slide.subtitle}</div>
                <div style={{ fontSize: 24, color: "#fff", fontWeight: 800, fontFamily: "Georgia,serif" }}>{slide.emoji} {slide.title}</div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div style={{ position: "absolute", bottom: -56, left: 0, right: 0, display: "flex", gap: 10, justifyContent: "center" }}>
            {SLIDES.map((s, i) => (
              <button key={s.id} onClick={() => goTo(i, i > current ? "next" : "prev")} style={{ width: i === current ? 40 : 28, height: 6, borderRadius: 3, background: i === current ? "#f59e0b" : "rgba(255,255,255,0.25)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s ease" }} />
            ))}
          </div>

          {/* Floating card */}
          <div style={{ position: "absolute", top: -20, right: -20, zIndex: 10, background: "rgba(15,20,40,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, opacity: animating ? 0 : 1, transform: animating ? "scale(0.9)" : "scale(1)", transition: "all 0.4s ease" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{slide.emoji}</div>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Category</div>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>{slide.title}</div>
            </div>
          </div>

          {/* Progress ring */}
          <div style={{ position: "absolute", bottom: -20, right: -10, zIndex: 10 }}>
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - (current + 1) / SLIDES.length)}`} strokeLinecap="round" transform="rotate(-90 24 24)" style={{ transition: "stroke-dashoffset 0.4s ease" }} />
              <text x="24" y="29" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="600">{current + 1}/{SLIDES.length}</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" style={{ display: "block", height: 60, width: "100%" }}>
          <path d="M0 60V30C360 0 720 60 1080 30C1260 15 1380 5 1440 0V60H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

// ─── TrustBar ─────────────────────────────────────────────────────────────────
function TrustBar() {
  return (
    <section style={{ background: "#fff", padding: "0 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #f1f5f9", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
          {TRUST.map(({ icon, title, desc }, i) => (
            <div key={title} style={{ padding: "24px 20px", background: "#fff", borderLeft: i > 0 ? "1px solid #f1f5f9" : "none", display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CategoryGrid ─────────────────────────────────────────────────────────────
function CategoryGrid() {
  return (
    <section style={{ padding: "80px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#2563eb", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 10 }}>
              <span style={{ width: 24, height: 1, background: "#2563eb", display: "inline-block" }} />
              Browse Categories
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 900, color: "#030712", letterSpacing: "-0.02em", margin: 0 }}>Find What You Need</h2>
          </div>
          <a href="/products" style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>View All →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {CATEGORIES.map(({ name, slug, count, emoji, color, bg, border }) => (
            <a key={name} href={`/products?category=${slug}`} style={{ position: "relative", borderRadius: 20, padding: "28px 24px", background: "#fff", border: "1.5px solid #f1f5f9", textDecoration: "none", display: "block", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "all 0.25s ease" }}
              onMouseEnter={e => { const t = e.currentTarget; t.style.transform = "translateY(-4px)"; t.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; t.style.borderColor = border; t.style.background = bg; }}
              onMouseLeave={e => { const t = e.currentTarget; t.style.transform = ""; t.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; t.style.borderColor = "#f1f5f9"; t.style.background = "#fff"; }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 18 }}>{emoji}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>{count} products</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${color},transparent)`, transform: "scaleX(0)", transformOrigin: "left", transition: "transform 0.3s ease" }} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const { id, name, price, images, category, reviews, stock } = product;
  const rating = avgRating(reviews);
  const primaryImage = images?.[0] ?? null;
  const isNew = Date.now() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
  const isLowStock = stock > 0 && stock <= 5;
  const isOutOfStock = stock === 0;

  return (
    <a href={`/products/${id}`} style={{ background: "#fff", borderRadius: 20, overflow: "hidden", textDecoration: "none", border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", transition: "all 0.3s ease", display: "block", opacity: isOutOfStock ? 0.7 : 1 }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.05)"; }}
    >
      {/* Image */}
      <div style={{ aspectRatio: "1", background: "#f8fafc", position: "relative", overflow: "hidden" }}>
        {primaryImage ? (
          <img src={primaryImage} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "#cbd5e1" }}>🔧</div>
        )}

        {/* Badges */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {isNew && <span style={{ fontSize: 10, fontWeight: 900, padding: "4px 10px", borderRadius: 50, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff" }}>NEW</span>}
          {isLowStock && <span style={{ fontSize: 10, fontWeight: 900, padding: "4px 10px", borderRadius: 50, background: "#f59e0b", color: "#111" }}>⚡ {stock} left</span>}
          {isOutOfStock && <span style={{ fontSize: 10, fontWeight: 900, padding: "4px 10px", borderRadius: 50, background: "#dc2626", color: "#fff" }}>Out of stock</span>}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{category?.name ?? "Hardware"}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111", lineHeight: 1.4, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{name}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#030712" }}>UGX {Number(price).toLocaleString()}</div>
            <div style={{ display: "flex", gap: 2, marginTop: 3, alignItems: "center" }}>
              {[...Array(5)].map((_, si) => (
                <span key={si} style={{ color: si < rating ? "#f59e0b" : "#e2e8f0", fontSize: 10 }}>★</span>
              ))}
              <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>({reviews.length})</span>
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: isOutOfStock ? "#e2e8f0" : "linear-gradient(135deg,#2563eb,#1d4ed8)", color: isOutOfStock ? "#94a3b8" : "#fff", fontSize: 16, flexShrink: 0 }}>→</div>
        </div>
      </div>
    </a>
  );
}

// ─── ProductGrid skeleton ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff", border: "1px solid #e2e8f0" }}>
      <div style={{ aspectRatio: "1", background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      <div style={{ padding: 16 }}>
        <div style={{ height: 10, borderRadius: 6, background: "#f1f5f9", marginBottom: 10, width: "40%" }} />
        <div style={{ height: 13, borderRadius: 6, background: "#f1f5f9", marginBottom: 6, width: "90%" }} />
        <div style={{ height: 13, borderRadius: 6, background: "#f1f5f9", marginBottom: 16, width: "70%" }} />
        <div style={{ height: 17, borderRadius: 6, background: "#f1f5f9", width: "55%" }} />
      </div>
    </div>
  );
}

// ─── ProductGrid ──────────────────────────────────────────────────────────────
function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFeaturedProducts(8)
      .then((data) => { if (!cancelled) setProducts(data); })
      .catch((err) => { if (!cancelled) setError(err.message ?? "Failed to load products."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return (
    <section style={{ padding: "80px 24px", background: "linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%)" }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#2563eb", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 10 }}>
              <span style={{ width: 24, height: 1, background: "#2563eb", display: "inline-block" }} />
              Just Arrived
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 900, color: "#030712", letterSpacing: "-0.02em", margin: 0 }}>Featured Products</h2>
          </div>
          <a href="/products" style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>View All →</a>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: "48px 24px", textAlign: "center", borderRadius: 20, background: "#fff", border: "1px solid #fecaca" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>Unable to load products</div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20 }}>{error}</div>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontWeight: 700, fontSize: 14 }}>Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", borderRadius: 20, background: "#fff", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#64748b" }}>No featured products yet</div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>Check back soon for our latest arrivals.</div>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <a href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 36px", borderRadius: 12, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>View All Products →</a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ─── WhyUs ────────────────────────────────────────────────────────────────────
function WhyUs() {
  return (
    <section style={{ padding: "80px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#2563eb", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 14 }}>
            <span style={{ width: 24, height: 1, background: "#2563eb", display: "inline-block" }} />
            Why Butebi?
          </div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 900, color: "#030712", letterSpacing: "-0.02em", marginBottom: 16 }}>The Smarter Way to Source Hardware</h2>
          <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: 28, fontSize: 15 }}>
            We've built Butebi around one simple promise: give Uganda's builders access to the best products at fair prices, with service they deserve.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              "Over 10,000 verified products from 500+ trusted brands",
              "Expert advice from hardware specialists — not just algorithms",
              "Flexible bulk pricing for contractors and large projects",
              "Returns within 14 days, no questions asked",
            ].map((pt) => (
              <li key={pt} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <span style={{ color: "#2563eb", fontSize: 11 }}>✓</span>
                </div>
                <span style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>{pt}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="/about" style={{ fontSize: 14, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>Our Story →</a>
            <a href="/contact" style={{ fontSize: 14, fontWeight: 600, color: "#64748b", textDecoration: "none" }}>Contact Us →</a>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { value: "10K+", label: "Products In Stock", color: "#2563eb", bg: "#eff6ff", icon: "📦" },
            { value: "50K+", label: "Happy Customers",  color: "#059669", bg: "#ecfdf5", icon: "👥" },
            { value: "500+", label: "Trusted Brands",   color: "#d97706", bg: "#fffbeb", icon: "🏆" },
            { value: "4.9",  label: "Star Rating",      color: "#7c3aed", bg: "#f5f3ff", icon: "⭐" },
          ].map(({ value, label, color, bg, icon }) => (
            <div key={label} style={{ borderRadius: 20, padding: 24, background: bg, border: `1px solid ${color}18`, transition: "all 0.25s ease" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 32, fontWeight: 900, color, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTABanner ────────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section style={{ padding: "80px 24px", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#0d1b3e 0%,#1a2f6e 50%,#0d1b3e 100%)" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,0.04) 1px,transparent 0)", backgroundSize: "28px 28px" }} />
      <div style={{ position: "absolute", left: "25%", top: "50%", transform: "translateY(-50%)", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,0.25) 0%,transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "relative", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 50, padding: "6px 16px", marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>🔥 Limited Time Offers</span>
        </div>
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", marginBottom: 16 }}>
          Special Deals &<br />Exclusive Discounts
        </h2>
        <p style={{ color: "rgba(148,163,184,0.85)", fontSize: 16, marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Subscribe and unlock exclusive deals every week. Be the first to know about flash sales and new arrivals.
        </p>
        <div style={{ display: "flex", gap: 10, maxWidth: 420, margin: "0 auto 28px", justifyContent: "center" }}>
          <input type="email" placeholder="Enter your email" style={{ flex: 1, padding: "14px 18px", borderRadius: 12, border: "none", fontSize: 14, background: "rgba(255,255,255,0.95)", color: "#111", outline: "none" }} />
          <button style={{ padding: "14px 22px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#111", fontWeight: 800, fontSize: 14, boxShadow: "0 4px 20px rgba(245,158,11,0.3)", whiteSpace: "nowrap" }}>Get Deals →</button>
        </div>
        <p style={{ fontSize: 12, color: "rgba(148,163,184,0.5)" }}>No spam. Unsubscribe anytime. Join 12,000+ subscribers.</p>
        <div style={{ marginTop: 40, paddingTop: 36, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <a href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 36px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none", backdropFilter: "blur(12px)" }}>Explore All Deals →</a>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", minHeight: "100vh" }}>
      <HeroCarousel />
      <TrustBar />
      <CategoryGrid />
      <ProductGrid />
      <WhyUs />
      {/* <CTABanner /> */}
    </div>
  );
}