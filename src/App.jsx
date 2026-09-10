import React, { useState, useEffect, useMemo, useRef } from "react";
import { ShoppingCart, X, Plus, Minus, Search, ChevronRight, Lock, LayoutDashboard, Package, Clock, CheckCircle2, Truck, PackageCheck, Trash2, ArrowLeft, Phone, MapPin, Building2, ClipboardList, User, LogOut, Mail, CreditCard, ListOrdered, Check, XCircle, Eye, EyeOff, Upload, Download, Printer, HelpCircle, Tag, MessageCircle, Send } from "lucide-react";

/* ============================================================
   DESIGN TOKENS
   Base:    #F4F5F8  (clinical white)
   Ink:     #10151F  (graphite)
   Primary: #1E3A5F  (titanium blue)
   Line:    #D7DCE3  (blueprint line)
   Accent:  #8A6A2E  (medical teal — CTAs / sterile badges)
   Bone:    #E9E2D0  (warm ivory — sparing use)
   Display: "Fraunces", body: "IBM Plex Sans", data: "IBM Plex Mono"
   ============================================================ */

const FONTS_LINK = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";

const DEFAULT_CATEGORIES = ["Trauma Plates", "Intramedullary Nails", "Screws & Fixation"];
const CLIENT_TYPES = ["Hospital", "Clinic", "Distributor", "Pharmacy"];

const DEFAULT_PRODUCTS = [
  { id: "TP-401", name: "Narrow LC-DCP Plate", cat: "Trauma Plates", material: "Ti-6Al-4V Titanium Alloy", dim: "6-hole · L98mm · W11mm", price: 8200, sterile: "Gamma Sterilized", moq: 1, image: null, hidden: false },
  { id: "TP-402", name: "Broad LC-DCP Plate", cat: "Trauma Plates", material: "316L Stainless Steel", dim: "8-hole · L156mm · W16mm", price: 7400, sterile: "Gamma Sterilized", moq: 1, image: null, hidden: false },
  { id: "TP-415", name: "Distal Femur Locking Plate", cat: "Trauma Plates", material: "Ti-6Al-4V Titanium Alloy", dim: "13-hole · L234mm · W18mm", price: 21500, sterile: "ETO Sterilized", moq: 1, image: null, hidden: false },
  { id: "TP-420", name: "Proximal Tibia Locking Plate", cat: "Trauma Plates", material: "316L Stainless Steel", dim: "10-hole · L182mm · W16mm", price: 18900, sterile: "Gamma Sterilized", moq: 1, image: null, hidden: false },
  { id: "TP-430", name: "1/3 Tubular Plate", cat: "Trauma Plates", material: "316L Stainless Steel", dim: "5-hole · L70mm · W12mm", price: 4100, sterile: "Gamma Sterilized", moq: 2, image: null, hidden: false },
  { id: "IN-510", name: "Femur Interlocking Nail", cat: "Intramedullary Nails", material: "Ti-6Al-4V Titanium Alloy", dim: "Ø10mm · L380mm", price: 26800, sterile: "ETO Sterilized", moq: 1, image: null, hidden: false },
  { id: "IN-522", name: "Tibia Interlocking Nail", cat: "Intramedullary Nails", material: "Ti-6Al-4V Titanium Alloy", dim: "Ø9mm · L330mm", price: 24200, sterile: "ETO Sterilized", moq: 1, image: null, hidden: false },
  { id: "IN-535", name: "Humerus Interlocking Nail", cat: "Intramedullary Nails", material: "316L Stainless Steel", dim: "Ø7mm · L240mm", price: 19600, sterile: "Gamma Sterilized", moq: 1, image: null, hidden: false },
  { id: "SC-611", name: "Cortical Screw", cat: "Screws & Fixation", material: "316L Stainless Steel", dim: "Ø3.5mm · L30mm", price: 320, sterile: "Gamma Sterilized", moq: 10, image: null, hidden: false },
  { id: "SC-618", name: "Cancellous Screw", cat: "Screws & Fixation", material: "Ti-6Al-4V Titanium Alloy", dim: "Ø4.0mm · L40mm", price: 410, sterile: "Gamma Sterilized", moq: 10, image: null, hidden: false },
  { id: "SC-630", name: "Locking Head Screw", cat: "Screws & Fixation", material: "Ti-6Al-4V Titanium Alloy", dim: "Ø5.0mm · L45mm", price: 560, sterile: "ETO Sterilized", moq: 10, image: null, hidden: false },
  { id: "SC-645", name: "Cannulated Screw", cat: "Screws & Fixation", material: "316L Stainless Steel", dim: "Ø6.5mm · L70mm", price: 890, sterile: "Gamma Sterilized", moq: 5, image: null, hidden: false },
];

function makeProductId(cat) {
  const known = { "Trauma Plates": "TP", "Intramedullary Nails": "IN", "Screws & Fixation": "SC" };
  let prefix = known[cat];
  if (!prefix) {
    const words = (cat || "").trim().split(/\s+/).filter(Boolean);
    prefix = words.length >= 2 ? (words[0][0] + words[1][0]) : (cat || "PR").slice(0, 2);
    prefix = prefix.toUpperCase();
  }
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

/* Compress an uploaded image file down to a small base64 JPEG so the
   catalog blob stays well under storage limits (mirrors the approach
   used in the shoe-line admin panel). */
function compressImageFile(file, maxDim = 700, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error("No file selected")); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const rawDataUrl = reader.result;
      if (!rawDataUrl) { reject(new Error("Could not read that file")); return; }
      try {
        const img = new Image();
        // If the browser can't decode it for canvas resizing (webview
        // quirks, unsupported format, canvas access blocked), still use
        // the original photo rather than losing the upload entirely.
        img.onerror = () => resolve(rawDataUrl);
        img.onload = () => {
          try {
            let { width, height } = img;
            if (!width || !height) { resolve(rawDataUrl); return; }
            if (width > maxDim || height > maxDim) {
              if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
              else { width = Math.round((width * maxDim) / height); height = maxDim; }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(rawDataUrl); return; }
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", quality);
            resolve(compressed && compressed.length > 100 ? compressed : rawDataUrl);
          } catch (e) {
            resolve(rawDataUrl);
          }
        };
        img.src = rawDataUrl;
      } catch (e) {
        resolve(rawDataUrl);
      }
    };
    reader.readAsDataURL(file);
  });
}

const money = (n) => "PKR " + n.toLocaleString("en-PK");

function printOrderInvoice(order) {
  const rows = order.items.map((it) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #ddd;">${it.id}</td><td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:center;">${it.qty}</td><td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right;">${money(it.price)}</td><td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right;">${money(it.price * it.qty)}</td></tr>`).join("");
  const html = `<!DOCTYPE html><html><head><title>Invoice ${order.orderId}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #10151F; padding: 32px; }
      h1 { font-size: 18px; margin-bottom: 2px; }
      .muted { color: #666; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th { text-align: left; padding: 6px 8px; border-bottom: 2px solid #10151F; font-size: 12px; }
      td { font-size: 13px; }
      .total-row td { font-weight: bold; border-top: 2px solid #10151F; }
    </style></head><body>
    <h1>Meridian Orthopaedics — Invoice</h1>
    <div class="muted">Order ${order.orderId} · ${new Date(order.ts).toLocaleString()}</div>
    <div class="muted">Status: ${order.status}</div>
    <div style="margin-top:16px;font-size:13px;">
      <strong>${order.customer.name}</strong>${order.customer.facility ? " · " + order.customer.facility : ""}<br/>
      ${order.customer.phone} · ${order.customer.email}<br/>
      ${order.customer.address}, ${order.customer.city}
      ${order.customer.license ? "<br/>License: " + order.customer.license : ""}
    </div>
    <table>
      <thead><tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Subtotal</th></tr></thead>
      <tbody>${rows}<tr class="total-row"><td colspan="3" style="text-align:right;padding:8px;">Total</td><td style="text-align:right;padding:8px;">${money(order.total)}</td></tr></tbody>
    </table>
  </body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

/* ---------------- Password / passcode handling ----------------
   Passwords, the admin passcode, and security answers are sent to the
   backend as-is over HTTPS (the normal, safe approach — this is how
   virtually every real login form works). The server generates a
   random salt per account and hashes there; the browser never computes
   or stores a password hash. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Demo passcode "meridian2026": on a brand-new/empty backend, whichever
// passcode is entered first at the admin gate becomes the real one
// (server-side, in the Settings sheet) — so entering "meridian2026" the
// very first time sets it to that, just like before.
function generateRecoveryCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  const group = () => {
    const arr = new Uint8Array(4);
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => chars[b % chars.length]).join("");
  };
  return `${group()}-${group()}-${group()}`;
}
const SECURITY_QUESTIONS = [
  "What city were you first licensed/registered in?",
  "What was the name of your first supplier?",
  "What is your mother's maiden name?",
  "What was the name of your first employer?",
];

/* ---------------- Real backend (Google Sheets + Apps Script) ----------------
   Every read/write now goes through this Apps Script Web App, which does
   its own server-side authorization on every call — it's not just a
   passthrough to a data store, so a technically determined person can't
   bypass the UI and pull other people's data by calling the API URL
   directly (the API URL is always visible in the browser, by design of
   how web apps work — the security has to live on the server, not in
   secrecy of the URL). */
const API_URL = "https://script.google.com/macros/s/AKfycbySx_BFHUULmBc2ssmAmIgHbJpTMWbmOBXo-mMicqMqAlLd3cSVenKY2T03LbydcxPX/exec";

async function api(action, payload) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      // text/plain avoids a CORS preflight request, which Apps Script
      // Web Apps don't handle — the body is still parsed as JSON server-side.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: "Network error — please check your connection and try again." };
  }
}

/* Client session token (proves who's logged in on every call — the
   server checks this, not just the app's own state). */
function getClientToken() {
  try { return window.localStorage.getItem("meridian-ortho:token"); } catch (e) { return null; }
}
function setClientTokenStorage(token) {
  try {
    if (token) window.localStorage.setItem("meridian-ortho:token", token);
    else window.localStorage.removeItem("meridian-ortho:token");
  } catch (e) {}
}

/* Admin session token — kept in sessionStorage (not localStorage) so it
   doesn't silently persist admin access across browser restarts on a
   shared computer; admin re-enters the passcode each fresh session. */
function getAdminToken() {
  try { return window.sessionStorage.getItem("meridian-ortho:admin-token"); } catch (e) { return null; }
}
function setAdminTokenStorage(token) {
  try {
    if (token) window.sessionStorage.setItem("meridian-ortho:admin-token", token);
    else window.sessionStorage.removeItem("meridian-ortho:admin-token");
  } catch (e) {}
}

/* ---------------- Technical line-drawing icons (signature element) ---------------- */

function TechFrame({ children, code, label }) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", backgroundColor: "#F4F5F8", border: "1px solid #D7DCE3", borderRadius: "2px", overflow: "hidden" }}>
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.35 }} aria-hidden="true">
        <defs>
          <pattern id={`grid-${code}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#D7DCE3" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${code})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}>{children}</div>
      <span style={{ position: "absolute", top: 6, left: 8, fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.02em", color: "rgba(35,66,77,0.6)" }}>{code}</span>
      {label && <span style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center", fontSize: "8px", fontWeight: 500, color: "rgba(35,66,77,0.55)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 8px" }}>{label}</span>}
    </div>
  );
}

/* Pulls the real numbers out of a product's stored dimension string
   (e.g. "8-hole · L156mm · W16mm" or "Ø9mm · L330mm") so each product's
   fallback diagram is drawn to its own spec rather than one generic
   picture per category. */
function parseSpec(dimStr = "") {
  const holeMatch = dimStr.match(/(\d+)\s*-?\s*hole/i);
  const lenMatch = dimStr.match(/L\s?(\d+(?:\.\d+)?)/i);
  const widMatch = dimStr.match(/W\s?(\d+(?:\.\d+)?)/i);
  const diaMatch = dimStr.match(/Ø\s?(\d+(?:\.\d+)?)/i);
  return {
    holes: holeMatch ? Math.max(3, Math.min(14, parseInt(holeMatch[1], 10))) : 6,
    length: lenMatch ? lenMatch[1] : null,
    width: widMatch ? widMatch[1] : null,
    diameter: diaMatch ? diaMatch[1] : null,
  };
}

function DimLine({ x1, y1, x2, y2, label, vertical }) {
  return (
    <g stroke="#8A6A2E" strokeWidth="0.8">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <line x1={x1} y1={y1 - 3} x2={x1} y2={y1 + 3} />
      <line x1={x2} y1={y2 - 3} x2={x2} y2={y2 + 3} />
      <text x={(x1 + x2) / 2} y={vertical ? (y1 + y2) / 2 : y1 - 5} fontSize="6" fill="#8A6A2E" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">{label}</text>
    </g>
  );
}

/* Plate diagram: hole count, length label and rounded vs. squared ends
   are all driven by the product's own dim string and name, so a narrow
   6-hole plate looks visibly different from a broad 10-hole one. */
function PlateIcon({ product }) {
  const spec = parseSpec(product?.dim);
  const holes = spec.holes;
  const isLocking = /locking/i.test(product?.name || "");
  const startX = 26, endX = 134, y = 52, barH = isLocking ? 22 : 18;
  const gap = (endX - startX - 16) / Math.max(1, holes - 1);
  const cxs = Array.from({ length: holes }, (_, i) => startX + 8 + i * gap);
  return (
    <svg viewBox="0 0 160 110" className="w-4/5 h-4/5">
      <rect x={startX} y={y - barH / 2} width={endX - startX} height={barH} rx={barH / 2} fill="none" stroke="#1E3A5F" strokeWidth="2" />
      {cxs.map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={y} r="4.2" fill="none" stroke="#1E3A5F" strokeWidth="1.4" />
          {isLocking && <circle cx={cx} cy={y} r="1.6" fill="#8A6A2E" />}
        </g>
      ))}
      <DimLine x1={startX} y1={30} x2={endX} y2={30} label={spec.length ? `${spec.length} mm` : `${holes}-hole`} />
      <DimLine x1={144} y1={y - barH / 2} x2={144} y2={y + barH / 2} label={spec.width || ""} vertical />
    </svg>
  );
}

/* Nail diagram: shaft length/diameter labels come from the product's
   dim string; a distal locking-hole cluster is drawn near the tip. */
function NailIcon({ product }) {
  const spec = parseSpec(product?.dim);
  return (
    <svg viewBox="0 0 160 110" className="w-4/5 h-4/5">
      <line x1="26" y1="55" x2="118" y2="55" stroke="#1E3A5F" strokeWidth="6" strokeLinecap="round" />
      <path d="M118 47 L136 55 L118 63 Z" fill="#1E3A5F" />
      {[88, 101].map((cx, i) => (
        <line key={i} x1={cx} y1="49" x2={cx} y2="61" stroke="#F4F5F8" strokeWidth="2" />
      ))}
      <circle cx="30" cy="55" r="6" fill="none" stroke="#1E3A5F" strokeWidth="2" />
      <DimLine x1={26} y1={36} x2={118} y2={36} label={spec.length ? `${spec.length} mm` : "length"} />
      <DimLine x1={146} y1={49} x2={146} y2={61} label={spec.diameter ? `Ø${spec.diameter}` : "Ø"} vertical />
    </svg>
  );
}

/* Screw diagram: head style reflects the product name (hex-drive locking
   head, slotted cortical/cancellous head, or hollow cannulated core),
   thread length and diameter labels come from the dim string. */
function ScrewIcon({ product }) {
  const spec = parseSpec(product?.dim);
  const name = product?.name || "";
  const isLocking = /locking/i.test(name);
  const isCannulated = /cannulated/i.test(name);
  const threadCount = spec.diameter ? Math.max(5, Math.min(10, Math.round(Number(spec.diameter) * 1.6))) : 8;
  return (
    <svg viewBox="0 0 160 110" className="w-4/5 h-4/5">
      {isLocking ? (
        <polygon points="55,26 69,26 76,32 76,40 69,46 55,46 48,40 48,32" fill="#1E3A5F" />
      ) : (
        <rect x="52" y="26" width="20" height="12" fill="#1E3A5F" />
      )}
      {!isLocking && <line x1="62" y1="26" x2="62" y2="38" stroke="#F4F5F8" strokeWidth="1.8" />}
      {isCannulated && <circle cx="62" cy={isLocking ? 36 : 32} r="2.6" fill="#F4F5F8" />}
      <g stroke="#1E3A5F" strokeWidth="1.8">
        {Array.from({ length: threadCount }).map((_, i) => (
          <line key={i} x1="50" y1={50 + i * 5.5} x2="74" y2={50 + i * 5.5} />
        ))}
      </g>
      {isCannulated && <line x1="62" y1="46" x2="62" y2={50 + (threadCount - 1) * 5.5} stroke="#F4F5F8" strokeWidth="2.4" />}
      <path d={`M50 ${50 + threadCount * 5.5} L62 ${58 + threadCount * 5.5} L74 ${50 + threadCount * 5.5} Z`} fill="none" stroke="#1E3A5F" strokeWidth="2" />
      <DimLine x1={92} y1={38} x2={92} y2={50 + threadCount * 5.5} label={spec.length ? `L${spec.length}` : "length"} vertical />
      <DimLine x1={38} y1={50} x2={38} y2={74} label={spec.diameter ? `Ø${spec.diameter}` : ""} vertical />
    </svg>
  );
}

/* Generic diagram for any admin-added category that isn't one of the
   three built-in ones — a neutral bounding box with the category name,
   rather than incorrectly reusing the screw diagram. */
function GenericIcon({ product }) {
  const label = (product?.cat || "ITEM").toUpperCase();
  return (
    <svg viewBox="0 0 160 110" className="w-4/5 h-4/5">
      <rect x="40" y="28" width="80" height="54" rx="4" fill="none" stroke="#1E3A5F" strokeWidth="2" />
      <line x1="40" y1="44" x2="120" y2="44" stroke="#1E3A5F" strokeWidth="1.2" />
      <circle cx="52" cy="36" r="2.4" fill="#8A6A2E" />
      <text x="80" y="66" fontSize="8.5" fill="#1E3A5F" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">{label.length > 14 ? label.slice(0, 14) + "…" : label}</text>
    </svg>
  );
}

function IconFor(product) {
  if (product.cat === "Trauma Plates") return <PlateIcon product={product} />;
  if (product.cat === "Intramedullary Nails") return <NailIcon product={product} />;
  if (product.cat === "Screws & Fixation") return <ScrewIcon product={product} />;
  return <GenericIcon product={product} />;
}

/* Shows the admin-uploaded product photo when one exists; otherwise
   falls back to a blueprint-style technical diagram drawn from that
   product's own name/dimensions, so customers can still tell what the
   specific item looks like even before a real photo is added. */
function ProductThumb({ product, className }) {
  if (product.image) {
    return (
      <div className={className || ""} style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", backgroundColor: "#F4F5F8", border: "1px solid #D7DCE3", borderRadius: "2px", overflow: "hidden" }}>
        <img src={product.image} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
      </div>
    );
  }
  return (
    <TechFrame code={product.id} label={product.name}>{IconFor(product)}</TechFrame>
  );
}

/* ---------------- Status pill ---------------- */
const STATUS_FLOW = ["Pending", "Confirmed", "Dispatched", "Delivered"];
const ALL_STATUSES = [...STATUS_FLOW, "Cancelled"];
const STATUS_ICON = { Pending: Clock, Confirmed: CheckCircle2, Dispatched: Truck, Delivered: PackageCheck, Cancelled: XCircle };
const STATUS_COLOR = {
  Pending: "bg-[#E9E2D0] text-[#6B5D2E]",
  Confirmed: "bg-[#D6E9E7] text-[#0E6B62]",
  Dispatched: "bg-[#D9E4EA] text-[#1E3A5F]",
  Delivered: "bg-[#DCEBD9] text-[#2E6B3B]",
  Cancelled: "bg-[#F3D9D6] text-[#9C3B30]",
};
// Same colors as plain hex, used as inline styles wherever a selected/pressed
// state needs to be guaranteed visible (Tailwind arbitrary-value classes can
// silently fail to apply in some render paths — inline style never does).
const STATUS_HEX = {
  Pending: { bg: "#E9E2D0", text: "#6B5D2E" },
  Confirmed: { bg: "#D6E9E7", text: "#0E6B62" },
  Dispatched: { bg: "#D9E4EA", text: "#1E3A5F" },
  Delivered: { bg: "#DCEBD9", text: "#2E6B3B" },
  Cancelled: { bg: "#F3D9D6", text: "#9C3B30" },
};
const SELECTED_STYLE = { backgroundColor: "#1E3A5F", color: "#FFFFFF", borderColor: "#1E3A5F" };

/* ============================================================ */

export default function App() {
  const [client, setClient] = useState(null); // logged-in client object
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  // Stay logged in across refresh / reopening the app — the server issues
  // a 30-day session token at login; we just ask it "is this token still
  // good?" on load. The server is the one enforcing expiry, not the app.
  useEffect(() => {
    (async () => {
      try {
        const token = getClientToken();
        if (token) {
          const r = await api("resumeSession", { token });
          if (r && r.ok) setClient(r.client);
          else setClientTokenStorage(null); // expired or invalid, clear it
        }
      } catch (e) {}
      setSessionChecked(true);
    })();
  }, []);
  function persistSession(token) {
    setClientTokenStorage(token);
  }
  function clearSession() {
    setClientTokenStorage(null);
  }

  const [view, setView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("admin") !== null ? "admin" : "catalog";
    } catch (e) { return "catalog"; }
  }); // catalog | myorders | admin
  const isAdminEntry = view === "admin"; // reached via the secret ?admin=1 link, before any client is logged in
  const [cart, setCart] = useState({}); // { productId: qty }
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false); // guests can browse freely; this only opens when login/register is actually needed (checkout, My Orders, profile)
  const [pendingAction, setPendingAction] = useState(null); // "checkout" | "myorders" | null — auto-resumes to this once logged in
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("default"); // default | price-asc | price-desc
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [toast, setToast] = useState(null);

  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const [myOrders, setMyOrders] = useState([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);

  /* ---- Product catalog (admin-editable, shared across all clients) ---- */
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [productBusy, setProductBusy] = useState(false);
  const [productError, setProductError] = useState("");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [heroSelection, setHeroSelection] = useState([]); // ordered array of product ids, [] = auto-pick

  // Catalog, categories, site settings, and hero banner selection are all
  // public (no login needed) so customers can browse — one call loads them
  // all together.
  async function loadPublicData() {
    try {
      const r = await api("getPublicData", {});
      if (r && r.ok) {
        if (Array.isArray(r.catalog) && r.catalog.length > 0) setProducts(r.catalog);
        if (Array.isArray(r.categories) && r.categories.length > 0) setCategories(r.categories);
        if (r.siteSettings && Object.keys(r.siteSettings).length > 0) setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...r.siteSettings });
        if (Array.isArray(r.heroSelection)) setHeroSelection(r.heroSelection);
      }
    } catch (e) {
      // keep defaults if the backend hasn't been seeded yet or the call failed
    }
    setCatalogLoaded(true);
  }
  useEffect(() => { loadPublicData(); }, []);

  // Product saves (add/edit/delete/hide) each go straight to their own
  // Products-sheet row via api() — see addProduct/updateProduct/
  // deleteProduct/toggleHideProduct below.

  async function addProduct(form) {
    setProductBusy(true);
    setProductError("");
    try {
      const id = form.id && form.id.trim() ? form.id.trim() : makeProductId(form.cat);
      if (products.some((p) => p.id === id)) {
        setProductError("A product with this code already exists.");
        setProductBusy(false);
        return false;
      }
      const newProduct = { ...form, id, price: Number(form.price) || 0, moq: Number(form.moq) || 1, hidden: false };
      const r = await api("addProduct", { token: getAdminToken(), product: newProduct });
      setProductBusy(false);
      if (!r.ok) { setProductError(r.error || "Could not add product. Please try again."); return false; }
      setProducts((prev) => [newProduct, ...prev]);
      return true;
    } catch (e) {
      setProductError("Could not add product. Please try again.");
      setProductBusy(false);
      return false;
    }
  }

  async function updateProduct(id, form) {
    setProductBusy(true);
    setProductError("");
    try {
      const updated = { ...form, id, price: Number(form.price) || 0, moq: Number(form.moq) || 1 };
      const r = await api("updateProduct", { token: getAdminToken(), id, product: updated });
      setProductBusy(false);
      if (!r.ok) { setProductError(r.error || "Could not save changes. Please try again."); return false; }
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      return true;
    } catch (e) {
      setProductError("Could not save changes. Please try again.");
      setProductBusy(false);
      return false;
    }
  }

  async function deleteProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((c) => { const n = { ...c }; delete n[id]; return n; });
    try { await api("deleteProduct", { token: getAdminToken(), id }); } catch (e) {}
  }

  async function toggleHideProduct(id) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, hidden: !p.hidden } : p)));
    try { await api("toggleHideProduct", { token: getAdminToken(), id }); } catch (e) {}
  }

  /* ---- Categories (admin-editable, shared across all clients) ---- */
  async function addCategory(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return { ok: false, error: "Category name can't be empty." };
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: "This category already exists." };
    }
    const next = [...categories, trimmed];
    setCategories(next);
    try { await api("saveCategories", { token: getAdminToken(), categories: next }); } catch (e) {}
    return { ok: true, value: trimmed };
  }

  /* ---- Site settings (contact info, legal text — admin-editable) ---- */
  async function updateSiteSettings(updates) {
    const next = { ...siteSettings, ...updates };
    setSiteSettings(next);
    const r = await api("saveSiteSettings", { token: getAdminToken(), siteSettings: next });
    if (r && r.ok) return { ok: true };
    return { ok: false, error: (r && r.error) || "Could not save settings. Please try again." };
  }

  /* ---- Admin passcode (changeable from the dashboard) ----
     The passcode itself lives only on the server now (Settings sheet).
     Changing it re-verifies the current one via a real login call first
     (so this can't be done just by knowing a stale client-side hash). */
  async function changeAdminPasscode(currentPass, newPass) {
    if (!newPass || newPass.length < 4) return { ok: false, error: "New passcode must be at least 4 characters." };
    const verify = await api("adminLogin", { passcode: currentPass });
    if (!verify.ok) return { ok: false, error: "Current passcode is incorrect." };
    const r = await api("changeAdminPasscode", { token: verify.token, newPasscode: newPass });
    if (!r.ok) return { ok: false, error: r.error || "Could not update passcode. Please try again." };
    setAdminTokenStorage(verify.token);
    return { ok: true };
  }

  /* ---- Admin passcode recovery (one-time recovery code) ----
     There's no email/SMS service behind this app, so a real "reset link"
     can't be sent. Instead, a recovery code is generated whenever the
     admin chooses to (from the dashboard) or after it's used — shown
     once, and the admin is expected to save it somewhere safe. Using it
     to recover access immediately invalidates it and issues a fresh one. */
  async function regenerateRecoveryCode() {
    const token = getAdminToken();
    if (!token) return { ok: false, error: "Admin session expired. Please log in again." };
    const code = generateRecoveryCode();
    const r = await api("setRecoveryCode", { token, recoveryCode: code });
    if (!r.ok) return { ok: false, error: r.error || "Could not generate a new recovery code. Please try again." };
    return { ok: true, code };
  }
  async function resetPasscodeWithRecoveryCode(code, newPass) {
    if (!newPass || newPass.length < 4) return { ok: false, error: "New passcode must be at least 4 characters." };
    const r = await api("recoverAdminPasscode", { recoveryCode: code, newPasscode: newPass });
    if (!r.ok) return { ok: false, error: r.error || "That recovery code doesn't match." };
    setAdminTokenStorage(r.token);
    // The used recovery code is now spent — issue a fresh one.
    const newCode = generateRecoveryCode();
    await api("setRecoveryCode", { token: r.token, recoveryCode: newCode });
    return { ok: true, newCode, token: r.token };
  }

  /* ---- Hero banner (which products rotate in the homepage carousel) ---- */
  async function saveHeroSelection(ids) {
    setHeroSelection(ids);
    try { await api("saveHeroSelection", { token: getAdminToken(), heroSelection: ids }); } catch (e) {}
  }

  /* ---- Back-button navigation ----
     We push a history entry whenever an overlay/view opens, so the
     phone's back button closes that overlay / returns to the previous
     screen instead of leaving the whole app. */
  const viewRef = useRef(view);
  const cartOpenRef = useRef(cartOpen);
  const checkoutOpenRef = useRef(checkoutOpen);
  const authGateOpenRef = useRef(authGateOpen);
  const profileOpenRef = useRef(profileOpen);
  const activeProductRef = useRef(activeProduct);
  const orderPlacedRef = useRef(orderPlaced);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { cartOpenRef.current = cartOpen; }, [cartOpen]);
  useEffect(() => { checkoutOpenRef.current = checkoutOpen; }, [checkoutOpen]);
  useEffect(() => { authGateOpenRef.current = authGateOpen; }, [authGateOpen]);
  useEffect(() => { profileOpenRef.current = profileOpen; }, [profileOpen]);
  useEffect(() => { activeProductRef.current = activeProduct; }, [activeProduct]);
  useEffect(() => { orderPlacedRef.current = orderPlaced; }, [orderPlaced]);

  useEffect(() => {
    function handlePopState() {
      if (orderPlacedRef.current) { setOrderPlaced(null); return; }
      if (checkoutOpenRef.current) { setCheckoutOpen(false); return; }
      if (authGateOpenRef.current) { setAuthGateOpen(false); setPendingAction(null); return; }
      if (profileOpenRef.current) { setProfileOpen(false); return; }
      if (cartOpenRef.current) { setCartOpen(false); return; }
      if (activeProductRef.current) { setActiveProduct(null); return; }
      if (viewRef.current !== "catalog") { setView("catalog"); return; }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function pushNav(layer) { try { window.history.pushState({ layer }, ""); } catch (e) {} }
  function replaceNav(layer) { try { window.history.replaceState({ layer }, ""); } catch (e) {} }
  function backNav() { window.history.back(); }

  // Browsing the catalog and adding to cart never requires an account —
  // this is only called at the actual point login/register is needed
  // (checkout, My Orders, profile). Whichever action triggered it
  // auto-resumes once login/register succeeds.
  function requireAuth(reason) {
    setPendingAction(reason || null);
    setAuthGateOpen(true);
    pushNav("auth");
  }
  useEffect(() => {
    if (!client || !pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    setAuthGateOpen(false);
    if (action === "checkout") { setCheckoutOpen(true); replaceNav("checkout"); }
    else if (action === "myorders") { goView("myorders"); }
    else if (action === "profile") { openProfile(); }
  }, [client, pendingAction]);

  function openCart() { setCartOpen(true); pushNav("cart"); }
  function openProfile() { setProfileOpen(true); pushNav("profile"); }
  function openProduct(p) { setActiveProduct(p); pushNav("product"); }
  function goView(v) { setView(v); pushNav(v); }
  function showOrderConfirm(order) { setOrderPlaced(order); replaceNav("orderConfirm"); }

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = FONTS_LINK;
    document.head.appendChild(l);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 1800);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const filtered = useMemo(() => {
    const list = products.filter((p) => !p.hidden && (cat === "All" || p.cat === cat) && (p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase())));
    if (sortOrder === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sortOrder === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, cat, query, sortOrder]);

  const cartItems = Object.entries(cart).filter(([, q]) => q > 0).map(([id, q]) => ({ product: products.find((p) => p.id === id), qty: q })).filter((i) => i.product);
  const cartTotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  function setQty(id, qty) {
    setCart((c) => ({ ...c, [id]: Math.max(0, qty) }));
  }
  function addToCart(product) {
    setCart((c) => ({ ...c, [product.id]: (c[product.id] || 0) + product.moq }));
    setToast(`${product.name} added to cart`);
  }

  /* ---- Client auth (real backend, server-side authorization) ---- */
  async function registerClient(form) {
    setAuthBusy(true);
    setAuthError("");
    try {
      if (!EMAIL_RE.test(form.email || "")) {
        setAuthError("Please enter a valid email address.");
        setAuthBusy(false);
        return false;
      }
      const { password, securityAnswer, ...rest } = form;
      const r = await api("registerClient", {
        email: form.email.toLowerCase(),
        password: form.password,
        securityAnswer: securityAnswer || "",
        profile: { ...rest, createdAt: Date.now() },
      });
      setAuthBusy(false);
      if (!r.ok) { setAuthError(r.error || "Could not create account. Please try again."); return false; }
      return true;
    } catch (e) {
      console.error("Register error:", e);
      setAuthError("Could not create account. Please try again.");
      setAuthBusy(false);
      return false;
    }
  }
  async function loginClient(email, password) {
    setAuthBusy(true);
    setAuthError("");
    try {
      const r = await api("loginClient", { email: email.toLowerCase(), password });
      setAuthBusy(false);
      if (!r.ok) { setAuthError(r.error || "Incorrect email or password."); return false; }
      setClient(r.client);
      persistSession(r.token);
      return true;
    } catch (e) {
      console.error("Login error:", e);
      setAuthError("Something went wrong logging in. Please try again.");
      setAuthBusy(false);
      return false;
    }
  }
  function logoutClient() {
    setClient(null);
    clearSession();
    setCart({});
    setView("catalog");
  }

  /* ---- Forgot password (security question) ----
     There's no email/SMS service behind this app, so a real "reset link"
     flow isn't possible. This uses a security question chosen at
     registration instead — the server gives the same generic error either
     way so an email's registration status can't be probed. */
  async function getSecurityQuestion(email) {
    try {
      const r = await api("getSecurityQuestion", { email: email.toLowerCase() });
      return r;
    } catch (e) {
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  }
  async function resetPasswordWithSecurityAnswer(email, answer, newPassword) {
    try {
      const r = await api("resetPassword", { email: email.toLowerCase(), answer, newPassword });
      return r;
    } catch (e) {
      return { ok: false, error: "Could not reset password. Please try again." };
    }
  }

  /* ---- Client profile (view/edit own details, change password) ---- */
  async function updateClientProfile(updates) {
    try {
      const r = await api("updateProfile", { token: getClientToken(), updates });
      if (!r.ok) return { ok: false, error: r.error || "Could not save changes. Please try again." };
      setClient(r.client);
      return { ok: true };
    } catch (e) {
      console.error("Update profile error:", e);
      return { ok: false, error: "Could not save changes. Please try again." };
    }
  }
  async function changeClientPassword(currentPassword, newPassword) {
    try {
      const r = await api("changePassword", { token: getClientToken(), currentPassword, newPassword });
      if (!r.ok) return { ok: false, error: r.error || "Current password is incorrect." };
      return { ok: true };
    } catch (e) {
      console.error("Change password error:", e);
      return { ok: false, error: "Could not update password. Please try again." };
    }
  }

  /* ---- Orders (admin) ---- */
  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const r = await api("getAllOrders", { token: getAdminToken() });
      setOrders(r.ok ? r.orders : []);
    } catch (e) {
      setOrders([]);
    }
    setOrdersLoading(false);
  }
  useEffect(() => { if (adminAuthed) loadOrders(); }, [adminAuthed]);

  async function updateStatus(orderId, status) {
    setOrders((os) => os.map((o) => (o.orderId === orderId ? { ...o, status } : o)));
    try { await api("updateOrderStatus", { token: getAdminToken(), orderId, status }); } catch (e) {}
  }

  /* ---- Orders (client's own) ----
     The server only ever returns orders belonging to the logged-in
     client's token — the client never asks for, and could never
     retrieve, another customer's orders. */
  async function loadMyOrders() {
    if (!client) return;
    setMyOrdersLoading(true);
    try {
      const r = await api("getMyOrders", { token: getClientToken() });
      setMyOrders(r.ok ? r.orders : []);
    } catch (e) {
      setMyOrders([]);
    }
    setMyOrdersLoading(false);
  }
  useEffect(() => { if (view === "myorders") loadMyOrders(); }, [view]);

  async function cancelMyOrder(orderId) {
    setMyOrders((os) => os.map((o) => (o.orderId === orderId ? { ...o, status: "Cancelled" } : o)));
    try { await api("cancelMyOrder", { token: getClientToken(), orderId }); } catch (e) {}
  }

  async function submitOrder(customerExtra) {
    const orderDraft = {
      customer: { name: client.name, type: client.type, facility: client.facility, phone: client.phone, email: client.email, city: client.city, address: client.address, ...customerExtra },
      items: cartItems.map((i) => ({ id: i.product.id, name: i.product.name, price: i.product.price, qty: i.qty })),
      total: cartTotal,
      payment: "Cash on Delivery / Bank Transfer",
    };
    try {
      const r = await api("submitOrder", { token: getClientToken(), order: orderDraft });
      if (r.ok) showOrderConfirm(r.order);
      else showOrderConfirm({ ...orderDraft, orderId: "—", ts: Date.now(), status: "Pending", saveFailed: true });
    } catch (e) {
      showOrderConfirm({ ...orderDraft, orderId: "—", ts: Date.now(), status: "Pending", saveFailed: true });
    }
    setCart({});
    setCheckoutOpen(false);
    setCartOpen(false);
  }

  if (isAdminEntry) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] text-[#10151F]" style={{ fontFamily: "IBM Plex Sans, sans-serif" }}>
        <style>{`
          .font-display { font-family: 'Fraunces', serif; }
          .font-mono { font-family: 'IBM Plex Mono', monospace; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
        <AdminView
          adminAuthed={adminAuthed} adminPass={adminPass} setAdminPass={setAdminPass}
          adminError={adminError} setAdminError={setAdminError} setAdminAuthed={setAdminAuthed}
          orders={orders} ordersLoading={ordersLoading} statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          updateStatus={updateStatus} goCatalog={() => { try { window.history.replaceState({}, "", window.location.pathname); } catch (e) {} setView("catalog"); }} reload={loadOrders}
          products={products} addProduct={addProduct} updateProduct={updateProduct}
          deleteProduct={deleteProduct} toggleHideProduct={toggleHideProduct}
          productBusy={productBusy} productError={productError} setProductError={setProductError}
          heroSelection={heroSelection} saveHeroSelection={saveHeroSelection}
          categories={categories} addCategory={addCategory}
          siteSettings={siteSettings} updateSiteSettings={updateSiteSettings}
          changeAdminPasscode={changeAdminPasscode}
          resetPasscodeWithRecoveryCode={resetPasscodeWithRecoveryCode} regenerateRecoveryCode={regenerateRecoveryCode}
        />
      </div>
    );
  }

  if (!sessionChecked) {
    return <div style={{ minHeight: "100vh", backgroundColor: "#F4F5F8" }} />;
  }

  // Guests can browse the full catalog and cart freely; the modal auth
  // gate below (authGateOpen) is what actually asks them to log in or
  // register, triggered only at checkout / My Orders / profile.

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-[#10151F] relative" style={{ fontFamily: "IBM Plex Sans, sans-serif" }}>
      <style>{`
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        ::selection { background: #8A6A2E; color: #fff; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #F4F5F8; }
        ::-webkit-scrollbar-thumb { background: #D7DCE3; border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: #8A6A2E; }
        @keyframes meridianDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(8%,10%) scale(1.12); } }
        @keyframes meridianDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-7%,-9%) scale(1.08); } }
        @keyframes meridianDrift3 { from { transform: translate(-4%,-3%) scale(.95); } to { transform: translate(5%,6%) scale(1.1); } }
        @keyframes meridianMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes meridianScan { 0% { transform: translateY(-20%); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(220%); opacity: 0; } }
        @keyframes meridianDraw { to { stroke-dashoffset: 0; } }
        @keyframes meridianFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .meridian-fade-up { animation: meridianFadeUp .6s ease backwards; }
        @media (prefers-reduced-motion: reduce) {
          .meridian-mesh, .meridian-marquee-track, .meridian-scan-beam, .meridian-draw, .meridian-fade-up { animation: none !important; }
          * { transition-duration: 0.01ms !important; }
        }
      `}</style>

      <AmbientBackground />

      {view === "myorders" ? (
        <MyOrdersView client={client} orders={myOrders} loading={myOrdersLoading} onCancel={cancelMyOrder} goCatalog={backNav} logout={logoutClient} cartCount={cartCount} setCartOpen={openCart} goMyOrders={() => (client ? goView("myorders") : requireAuth("myorders"))} openProfile={() => (client ? openProfile() : requireAuth("profile"))} siteSettings={siteSettings} />
      ) : (
        <CatalogView
          client={client} logout={logoutClient}
          cat={cat} setCat={setCat} query={query} setQuery={setQuery}
          sortOrder={sortOrder} setSortOrder={setSortOrder} categories={categories}
          filtered={filtered} products={products} heroSelection={heroSelection} addToCart={addToCart} setQty={setQty} cart={cart}
          activeProduct={activeProduct} setActiveProduct={openProduct} closeProduct={backNav}
          cartCount={cartCount} setCartOpen={openCart}
          goMyOrders={() => (client ? goView("myorders") : requireAuth("myorders"))}
          openProfile={() => (client ? openProfile() : requireAuth("profile"))}
          siteSettings={siteSettings}
        />
      )}

      {toast && (
        <div style={{ backgroundColor: "#10151F", color: "#FFFFFF" }} className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] text-sm px-4 py-2.5 rounded-none flex items-center gap-2 shadow-lg">
          <Check size={14} className="text-[#8A6A2E]" /> {toast}
        </div>
      )}

      {cartOpen && (
        <CartDrawer
          cartItems={cartItems} cartTotal={cartTotal} setQty={setQty}
          onClose={backNav}
          onCheckout={() => { setCartOpen(false); if (client) { setCheckoutOpen(true); replaceNav("checkout"); } else { requireAuth("checkout"); } }}
        />
      )}

      {authGateOpen && (
        <AuthGate
          onRegister={registerClient} onLogin={loginClient} busy={authBusy} error={authError} clearError={() => setAuthError("")}
          getSecurityQuestion={getSecurityQuestion} resetPasswordWithSecurityAnswer={resetPasswordWithSecurityAnswer}
          onClose={backNav}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal
          client={client} cartItems={cartItems} cartTotal={cartTotal} setQty={setQty}
          onClose={backNav}
          onSubmit={submitOrder}
        />
      )}

      {orderPlaced && (
        <OrderConfirmModal order={orderPlaced} onClose={backNav} onViewOrders={() => { setOrderPlaced(null); goView("myorders"); }} />
      )}

      {profileOpen && (
        <ProfileModal
          client={client}
          orderCount={myOrders.length}
          onClose={backNav}
          onSave={updateClientProfile}
          onChangePassword={changeClientPassword}
          onLogout={() => { backNav(); logoutClient(); }}
        />
      )}

      <ChatWidget />
    </div>
  );
}

/* ---------------- Auth (register / login) ---------------- */

/* ---------------- Floating AI chatbot (Gemini, via backend) ---------------- */
/* ---------------- Ambient background (Cobalt & Brass theme) ----------------
   Purely decorative — fixed, pointer-events-none, sits behind all real
   content in normal DOM stacking order. No effect on data or logic. */
function AmbientBackground() {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* aurora mesh blobs */}
      <div style={{
        position: "absolute", width: "62vw", height: "62vw", minWidth: 420, top: "-24%", left: "-16%",
        background: "#8A6A2E", opacity: 0.22, borderRadius: "50%", filter: "blur(110px)",
        animation: "meridianDrift1 24s ease-in-out infinite alternate",
      }} className="meridian-mesh" />
      <div style={{
        position: "absolute", width: "56vw", height: "56vw", minWidth: 380, bottom: "-26%", right: "-14%",
        background: "#1E3A5F", opacity: 0.20, borderRadius: "50%", filter: "blur(110px)",
        animation: "meridianDrift2 28s ease-in-out infinite alternate",
      }} className="meridian-mesh" />
      <div style={{
        position: "absolute", width: "40vw", height: "40vw", minWidth: 280, top: "32%", left: "38%",
        background: "#5E5433", opacity: 0.14, borderRadius: "50%", filter: "blur(110px)",
        animation: "meridianDrift3 20s ease-in-out infinite alternate",
      }} className="meridian-mesh" />

      {/* fine dot-grid */}
      <div style={{
        position: "absolute", inset: "-10%", opacity: 0.4,
        backgroundImage: "radial-gradient(rgba(16,21,31,0.22) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* subtle grain texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.045, mixBlendMode: "overlay",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }} />

      {/* faint watermark — locking plate line art */}
      <svg viewBox="0 0 240 160" style={{ position: "absolute", right: "-6%", bottom: "-8%", width: "44vw", maxWidth: 600, opacity: 0.05 }}>
        <rect x="60" y="30" width="28" height="96" rx="12" fill="none" stroke="#10151F" strokeWidth="3" />
        <line x1="88" y1="48" x2="120" y2="48" stroke="#10151F" strokeWidth="3" />
        <line x1="88" y1="112" x2="120" y2="112" stroke="#10151F" strokeWidth="3" />
        {[46, 66, 86, 106].map((y) => <circle key={y} cx="74" cy={y} r="4" fill="none" stroke="#10151F" strokeWidth="2" />)}
      </svg>

      {/* blueprint corner brackets */}
      <div style={{ position: "fixed", width: 56, height: 56, top: 20, left: 20, opacity: 0.3, borderTop: "1.5px solid #D7DCE3", borderLeft: "1.5px solid #D7DCE3" }} />
      <div style={{ position: "fixed", width: 56, height: 56, bottom: 20, right: 20, opacity: 0.3, borderBottom: "1.5px solid #D7DCE3", borderRight: "1.5px solid #D7DCE3" }} />
    </div>
  );
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I can answer questions about our implants, materials, sizes, and ordering. What would you like to know?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  function getVisitorId() {
    try {
      let id = window.localStorage.getItem("meridian-ortho:visitor-id");
      if (!id) {
        id = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : "v-" + Date.now() + "-" + Math.random().toString(16).slice(2);
        window.localStorage.setItem("meridian-ortho:visitor-id", id);
      }
      return id;
    } catch (e) {
      return "anon";
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    try {
      const history = nextMessages.slice(0, -1).map((m) => ({ role: m.role, text: m.text }));
      const r = await api("chatWithBot", { message: text, history, visitorId: getVisitorId() });
      if (r && r.ok) {
        setMessages((m) => [...m, { role: "bot", text: r.reply }]);
      } else {
        setMessages((m) => [...m, { role: "bot", text: (r && r.error) || "Sorry, something went wrong. Please try again." }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "bot", text: "Sorry, something went wrong. Please try again." }]);
    }
    setSending(false);
  }

  return (
    <>
      {open ? (
        <div style={{ position: "fixed", bottom: 20, right: 20, width: 320, maxWidth: "calc(100vw - 32px)", height: 440, maxHeight: "calc(100vh - 100px)", backgroundColor: "#FFFFFF", border: "1px solid #D7DCE3", borderRadius: 8, boxShadow: "0 12px 32px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", zIndex: 70 }}>
          <div style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="flex items-center justify-between px-3.5 py-3 rounded-t-[8px]">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} />
              <span className="text-sm font-medium font-display">Product Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" style={{ color: "rgba(255,255,255,0.85)" }} className="hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ backgroundColor: "#F4F5F8" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "7px 10px", borderRadius: 6, fontSize: 13, lineHeight: 1.4,
                  backgroundColor: m.role === "user" ? "#8A6A2E" : "#FFFFFF",
                  color: m.role === "user" ? "#FFFFFF" : "#10151F",
                  border: m.role === "user" ? "none" : "1px solid #D7DCE3",
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "7px 10px", borderRadius: 6, fontSize: 13, backgroundColor: "#FFFFFF", border: "1px solid #D7DCE3", color: "#10151Faa" }}>Typing…</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 p-2.5 border-t" style={{ borderColor: "#D7DCE3" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about our products…"
              aria-label="Chat message"
              className="flex-1 px-2.5 py-2 text-sm border rounded-none focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40"
              style={{ borderColor: "#D7DCE3" }}
            />
            <button onClick={send} disabled={sending || !input.trim()} aria-label="Send" style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF", opacity: sending || !input.trim() ? 0.5 : 1 }} className="p-2 rounded-none">
              <Send size={15} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat assistant"
          style={{ position: "fixed", bottom: 20, right: 20, backgroundColor: "#1E3A5F", color: "#FFFFFF", width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.25)", zIndex: 70 }}
        >
          <MessageCircle size={22} />
        </button>
      )}
    </>
  );
}

function AuthGate({ onRegister, onLogin, busy, error, clearError, getSecurityQuestion, resetPasswordWithSecurityAnswer, onClose }) {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [form, setForm] = useState({ name: "", type: "Hospital", facility: "", license: "", phone: "", email: "", city: "", address: "", password: "", securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [justRegistered, setJustRegistered] = useState(false);

  // Forgot-password flow state
  const [fpStep, setFpStep] = useState("email"); // email | question | done
  const [fpEmail, setFpEmail] = useState("");
  const [fpQuestion, setFpQuestion] = useState("");
  const [fpAnswer, setFpAnswer] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpError, setFpError] = useState("");
  const [fpBusy, setFpBusy] = useState(false);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = FONTS_LINK;
    document.head.appendChild(l);
  }, []);

  const missingRegisterFields = [
    !form.name && "name",
    !form.type && "account type",
    !form.phone && "phone",
    !form.email && "email",
    (form.email && !EMAIL_RE.test(form.email)) && "a valid email",
    !form.city && "city",
    !form.address && "address",
    (!form.password || form.password.length < 4) && "password (4+ characters)",
    !form.securityAnswer && "security question answer",
  ].filter(Boolean);
  const canRegister = missingRegisterFields.length === 0;

  const missingLoginFields = [!loginForm.email && "email", !loginForm.password && "password"].filter(Boolean);
  const canLogin = missingLoginFields.length === 0;

  async function handleRegister() {
    const ok = await onRegister(form);
    if (ok) {
      setLoginForm({ email: form.email, password: "" });
      setJustRegistered(true);
      setMode("login");
    }
  }

  function openForgot() {
    setFpStep("email"); setFpEmail(loginForm.email || ""); setFpAnswer(""); setFpNewPassword(""); setFpError("");
    setMode("forgot");
  }

  async function handleFpFindAccount() {
    if (!EMAIL_RE.test(fpEmail)) { setFpError("Please enter a valid email address."); return; }
    setFpBusy(true); setFpError("");
    const res = await getSecurityQuestion(fpEmail);
    setFpBusy(false);
    if (res.ok) { setFpQuestion(res.question); setFpStep("question"); }
    else setFpError(res.error);
  }

  async function handleFpReset() {
    if (!fpAnswer) { setFpError("Please answer the security question."); return; }
    if (!fpNewPassword || fpNewPassword.length < 4) { setFpError("New password must be at least 4 characters."); return; }
    setFpBusy(true); setFpError("");
    const res = await resetPasswordWithSecurityAnswer(fpEmail, fpAnswer, fpNewPassword);
    setFpBusy(false);
    if (res.ok) { setFpStep("done"); }
    else setFpError(res.error);
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto" style={{ fontFamily: "IBM Plex Sans, sans-serif" }} onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <style>{`.font-display { font-family: 'Fraunces', serif; } .font-mono { font-family: 'IBM Plex Mono', monospace; }`}</style>
      <div className="max-w-md w-full py-6 sm:py-0 relative">
        {onClose && (
          <button onClick={onClose} aria-label="Close and continue browsing" style={{ backgroundColor: "#1E3A5F" }} className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md z-20">
            <X size={18} />
          </button>
        )}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="w-9 h-9 rounded-none flex items-center justify-center font-mono text-[10px]">OI</div>
          <div>
            <div className="font-display font-semibold text-base leading-tight">Meridian Orthopaedics</div>
            <div className="text-[10px] tracking-widest uppercase text-[#10151F]/40">Implant Manufacturing</div>
          </div>
        </div>

        <div style={{ maxHeight: "85vh", overflowY: "auto" }} className="bg-white border border-[#D7DCE3] rounded-none overflow-hidden">
          {mode === "login" && (
            <div className="p-5 space-y-3">
              <div className="mb-1">
                <div className="font-display font-semibold text-lg">Log in</div>
                <p className="text-xs text-[#10151F]/50 mt-0.5">Log in to your client account to view pricing and order.</p>
              </div>
              {justRegistered && (
                <div className="bg-[#D6E9E7] text-[#0E6B62] text-xs rounded-none p-2.5 flex items-center gap-1.5"><CheckCircle2 size={14} /> Account created — log in below to continue.</div>
              )}
              <div className="space-y-3" onKeyDown={(e) => { if (e.key === "Enter" && canLogin && !busy) onLogin(loginForm.email, loginForm.password); }}>
              <Field icon={Mail} type="email" placeholder="Email address" value={loginForm.email} onChange={(v) => setLoginForm({ ...loginForm, email: v })} />
              <Field icon={Lock} type="password" placeholder="Password" value={loginForm.password} onChange={(v) => setLoginForm({ ...loginForm, password: v })} />
              {error && <div className="text-xs text-red-500">{error}</div>}
              <button disabled={!canLogin || busy} onClick={() => onLogin(loginForm.email, loginForm.password)} style={!(!canLogin || busy) ? { backgroundColor: "#1E3A5F", color: "#FFFFFF", borderColor: "#1E3A5F" } : undefined} className={`w-full py-3 rounded-none text-sm font-semibold border-2 transition-colors ${!canLogin || busy ? "bg-[#F4F5F8] text-[#10151F]/40 border-[#D7DCE3]" : "hover:opacity-90"}`}>
                {busy ? "Logging in…" : "Log in"}
              </button>
              {!canLogin && !busy && (
                <div className="text-[11px] text-[#10151F]/40 text-center">Fill in: {missingLoginFields.join(", ")}</div>
              )}
              </div>
              <button onClick={openForgot} className="w-full text-center text-xs text-[#10151F]/50 hover:underline">Forgot password?</button>
              <button onClick={() => { setMode("register"); setJustRegistered(false); clearError(); }} className="w-full text-center text-xs text-[#10151F]/60 pt-1">
                New client? <span className="text-[#8A6A2E] font-medium underline">Register here</span>
              </button>
            </div>
          )}

          {mode === "register" && (
            <div className="p-5 space-y-3">
              <div className="mb-1">
                <div className="font-display font-semibold text-lg">Register</div>
                <p className="text-xs text-[#10151F]/50 mt-0.5">Create a client account to view catalog pricing and place orders.</p>
              </div>
              <Field icon={User} placeholder="Contact person name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <SelectPills label="Account type" options={CLIENT_TYPES} value={form.type} onChange={(t) => setForm({ ...form, type: t })} />
              <div onKeyDown={(e) => { if (e.key === "Enter" && canRegister && !busy) handleRegister(); }} className="space-y-3">
              <Field icon={Building2} placeholder="Facility / business name" value={form.facility} onChange={(v) => setForm({ ...form, facility: v })} />
              <Field icon={CreditCard} placeholder="Business / drug license no. (optional)" value={form.license} onChange={(v) => setForm({ ...form, license: v })} />
              <Field icon={Phone} placeholder="Phone number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field icon={MapPin} placeholder="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Field icon={MapPin} placeholder="Full address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
              <Field icon={Lock} type="password" placeholder="Create password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40 mb-1.5 flex items-center gap-1"><HelpCircle size={11} /> Security question (used to reset your password)</div>
                <select value={form.securityQuestion} onChange={(e) => setForm({ ...form, securityQuestion: e.target.value })} style={{ color: "#10151F" }} className="w-full px-2.5 py-2 text-xs border border-[#D7DCE3] rounded-none mb-1.5 focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40">
                  {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
                <Field icon={HelpCircle} placeholder="Your answer" value={form.securityAnswer} onChange={(v) => setForm({ ...form, securityAnswer: v })} />
              </div>
              {error && <div className="text-xs text-red-500">{error}</div>}
              <button disabled={!canRegister || busy} onClick={handleRegister} style={!(!canRegister || busy) ? { backgroundColor: "#8A6A2E", color: "#FFFFFF", borderColor: "#8A6A2E" } : undefined} className={`w-full py-3 rounded-none text-sm font-semibold border-2 transition-colors ${!canRegister || busy ? "bg-[#F4F5F8] text-[#10151F]/40 border-[#D7DCE3]" : "hover:opacity-90"}`}>
                {busy ? "Registering…" : "Register"}
              </button>
              {!canRegister && !busy && (
                <div className="text-[11px] text-[#10151F]/40 text-center">Fill in: {missingRegisterFields.join(", ")}</div>
              )}
              </div>
              <button onClick={() => { setMode("login"); clearError(); }} className="w-full text-center text-xs text-[#10151F]/60 pt-1">
                Already have an account? <span className="text-[#8A6A2E] font-medium underline">Log in</span>
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <div className="p-5 space-y-3">
              <div className="mb-1">
                <div className="font-display font-semibold text-lg">Reset password</div>
                <p className="text-xs text-[#10151F]/50 mt-0.5">Answer your security question to set a new password.</p>
              </div>

              {fpStep === "email" && (
                <>
                  <Field icon={Mail} type="email" placeholder="Your account email" value={fpEmail} onChange={setFpEmail} />
                  {fpError && <div className="text-xs text-red-500">{fpError}</div>}
                  <button disabled={fpBusy} onClick={handleFpFindAccount} style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="w-full py-3 rounded-none text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                    {fpBusy ? "Checking…" : "Continue"}
                  </button>
                </>
              )}

              {fpStep === "question" && (
                <>
                  <div className="text-xs text-[#10151F]/70 bg-[#F4F5F8] border border-[#D7DCE3] rounded-none p-2.5">{fpQuestion}</div>
                  <Field icon={HelpCircle} placeholder="Your answer" value={fpAnswer} onChange={setFpAnswer} />
                  <Field icon={Lock} type="password" placeholder="New password (4+ characters)" value={fpNewPassword} onChange={setFpNewPassword} />
                  {fpError && <div className="text-xs text-red-500">{fpError}</div>}
                  <button disabled={fpBusy} onClick={handleFpReset} style={{ backgroundColor: "#8A6A2E", color: "#FFFFFF" }} className="w-full py-3 rounded-none text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                    {fpBusy ? "Resetting…" : "Reset password"}
                  </button>
                </>
              )}

              {fpStep === "done" && (
                <div className="bg-[#D6E9E7] text-[#0E6B62] text-xs rounded-none p-2.5 flex items-center gap-1.5"><CheckCircle2 size={14} /> Password reset — you can log in with your new password now.</div>
              )}

              <button onClick={() => { setMode("login"); clearError(); }} className="w-full text-center text-xs text-[#10151F]/60 pt-1">
                Back to <span className="text-[#8A6A2E] font-medium underline">Log in</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Reusable selectable pill group — selected state is unmistakable: filled + ring + checkmark + a caption naming the current choice */
function SelectPills({ label, options, value, onChange }) {
  return (
    <div>
      {label && <div className="text-[10px] text-[#10151F]/40 mb-1 uppercase tracking-wide">{label}</div>}
      <div className="flex gap-1.5 flex-wrap">
        {options.map((t) => {
          const selected = value === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              style={selected ? SELECTED_STYLE : undefined}
              className={`px-3 py-2 text-xs rounded-none border-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
                selected
                  ? "font-semibold shadow-sm"
                  : "bg-white border-[#D7DCE3] text-[#10151F]/70"
              }`}
            >
              {selected ? <Check size={13} strokeWidth={3} /> : <span className="w-[13px] h-[13px] rounded-full border border-[#D7DCE3] inline-block" />}
              {t}
            </button>
          );
        })}
      </div>
      {value && (
        <div className="text-[11px] text-[#8A6A2E] font-mono mt-1.5 flex items-center gap-1">
          <Check size={11} strokeWidth={3} /> Selected: {value}
        </div>
      )}
    </div>
  );
}

/* Auto-rotating hero banner — cycles through a handful of catalog
   products (real photo if uploaded, technical diagram otherwise),
   advancing on its own every ~2.5s with dot indicators, similar to a
   typical promo carousel. */
function HeroSlideVisual({ product }) {
  if (product.image) {
    return <img src={product.image} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="eager" decoding="async" />;
  }
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.35 }} aria-hidden="true">
        <defs>
          <pattern id={`hero-grid-${product.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" fill="none" stroke="#D7DCE3" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#hero-grid-${product.id})`} />
      </svg>
      <div style={{ position: "relative", width: "85%", height: "85%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {IconFor(product)}
      </div>
    </div>
  );
}

function HeroCarousel({ products, heroSelection }) {
  const slides = useMemo(() => {
    const visible = (products || []).filter((p) => !p.hidden);
    if (visible.length === 0) return [];
    if (heroSelection && heroSelection.length > 0) {
      const byId = Object.fromEntries(visible.map((p) => [p.id, p]));
      const picked = heroSelection.map((id) => byId[id]).filter(Boolean);
      if (picked.length > 0) return picked;
    }
    const seen = new Set();
    const picked = [];
    for (const p of visible) {
      if (!seen.has(p.cat)) { picked.push(p); seen.add(p.cat); }
      if (picked.length >= 3) break;
    }
    for (const p of visible) {
      if (picked.length >= 6) break;
      if (!picked.some((x) => x.id === p.id)) picked.push(p);
    }
    return picked;
  }, [products, heroSelection]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);
  useEffect(() => { if (index >= slides.length) setIndex(0); }, [slides.length, index]);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  function onTiltMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: px * 10, y: -py * 10 });
  }

  const frameStyle = {
    position: "relative", aspectRatio: "4 / 3", overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.68)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(215,220,227,0.9)", borderRadius: "2px",
    boxShadow: "0 30px 60px -30px rgba(16,21,31,0.45)",
    transform: `perspective(900px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
    transition: "transform 0.15s ease-out",
  };

  if (slides.length === 0) return <div style={{ ...frameStyle, transform: undefined }} />;

  return (
    <div style={frameStyle} onMouseMove={onTiltMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
      <div className="meridian-scan-beam" style={{
        position: "absolute", left: 0, right: 0, height: "36%",
        background: "linear-gradient(to bottom, transparent, rgba(138,106,46,0.28), transparent)",
        animation: "meridianScan 7s ease-in-out infinite", zIndex: 2, mixBlendMode: "multiply", pointerEvents: "none", opacity: 0.6,
      }} />
      {slides.map((p, i) => (
        <div key={p.id} style={{ position: "absolute", inset: 0, opacity: i === index ? 1 : 0, transition: "opacity 1.1s ease-in-out" }}>
          <HeroSlideVisual product={p} />
          <span style={{ position: "absolute", top: 8, left: 10, fontFamily: "monospace", fontSize: "9px", color: "rgba(35,66,77,0.55)" }}>{p.id}</span>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "22px 12px 10px", background: "linear-gradient(to top, rgba(23,30,34,0.72), rgba(23,30,34,0))" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>{p.name}</div>
            <div style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.75)" }}>{p.cat}</div>
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, zIndex: 3 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? "#8A6A2E" : "rgba(255,255,255,0.7)", border: "none", padding: 0, cursor: "pointer", transition: "width 0.3s ease" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Marquee / Stats / Trust badges (Cobalt & Brass) ----------------
   All three are admin-editable via Settings (siteSettings.statsSection,
   siteSettings.trustBadges) and heroEyebrowBadges — with sensible
   defaults so the homepage never renders empty on first load. */
const DEFAULT_STATS = [
  { value: "15", label: "Years manufacturing" },
  { value: "150+", label: "SKUs in catalogue" },
  { value: "500+", label: "Facilities served" },
  { value: "ISO 13485", label: "Certified manufacturer" },
];
const DEFAULT_TRUST_BADGES = [
  { label: "ISO 13485 Certified", icon: "shield" },
  { label: "CE Marked", icon: "certificate" },
  { label: "GMP Compliant", icon: "factory" },
  { label: "Ti-6Al-4V Grade 5", icon: "material" },
];
const TRUST_ICONS = { shield: CheckCircle2, certificate: Tag, factory: Building2, material: Package };

function MarqueeStrip({ text }) {
  const items = (text && text.length ? text : ["PRECISION ENGINEERED", "ISO 13485 CERTIFIED", "TITANIUM GRADE 5", "DIRECT FROM MANUFACTURER", "GAMMA / ETO STERILIZED"]);
  const line = items.join("  ·  ");
  return (
    <div style={{ borderTop: "1px solid #D7DCE3", borderBottom: "1px solid #D7DCE3", backgroundColor: "rgba(255,255,255,0.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", overflow: "hidden", padding: "12px 0" }}>
      <div className="meridian-marquee-track font-mono" style={{ display: "flex", width: "max-content", gap: 48, fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.6, animation: "meridianMarquee 26s linear infinite", whiteSpace: "nowrap" }}>
        <span>{line}</span>
        <span>{line}</span>
      </div>
    </div>
  );
}

function StatTile({ stat }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState(0);
  const numeric = /^\d+$/.test(String(stat.value).replace(/\D/g, "")) && /^\d+\+?$/.test(String(stat.value).trim());
  const target = numeric ? parseInt(stat.value, 10) : null;
  const suffix = numeric && String(stat.value).includes("+") ? "+" : "";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (target !== null) {
            const duration = 1200, start = performance.now();
            function step(now) {
              const p = Math.min(1, (now - start) / duration);
              setDisplay(Math.round(p * target));
              if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
          }
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <div ref={ref} style={{
      backgroundColor: "rgba(255,255,255,0.65)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      border: "1px solid #D7DCE3", borderRadius: "2px", padding: "20px 18px", textAlign: "left",
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.6s ease, transform 0.6s ease",
    }}>
      <div className="font-display" style={{ fontSize: 28, fontWeight: 600, color: "#8A6A2E", lineHeight: 1 }}>
        {target !== null ? display + suffix : stat.value}
      </div>
      <div className="text-xs mt-2" style={{ color: "rgba(16,21,31,0.6)" }}>{stat.label}</div>
    </div>
  );
}

function StatsSection({ stats }) {
  const list = stats && stats.length > 0 ? stats : DEFAULT_STATS;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {list.map((s, i) => <StatTile key={i} stat={s} />)}
    </div>
  );
}

function TrustBadgesRow({ badges }) {
  const list = badges && badges.length > 0 ? badges : DEFAULT_TRUST_BADGES;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 flex flex-wrap gap-2.5">
      {list.map((b, i) => {
        const Icon = TRUST_ICONS[b.icon] || CheckCircle2;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, padding: "8px 13px", borderRadius: 100, border: "1px solid #D7DCE3", opacity: 0.85, backgroundColor: "rgba(255,255,255,0.5)" }}>
            <Icon size={14} style={{ color: "#8A6A2E" }} /> {b.label}
          </div>
        );
      })}
    </div>
  );
}

function EyebrowBadges({ badges }) {
  const list = badges && badges.length > 0 ? badges : [{ text: "Direct from the manufacturer" }];
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {list.map((b, i) => (
        <span key={i} className="font-mono" style={{
          display: "inline-flex", alignItems: "center", gap: 7, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase",
          padding: "6px 12px", borderRadius: 100, border: "1px solid #D7DCE3", backgroundColor: "rgba(255,255,255,0.6)", backdropFilter: "blur(6px)", color: "#8A6A2E",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#8A6A2E", boxShadow: "0 0 0 4px rgba(138,106,46,0.2)" }} />
          {b.text}
        </span>
      ))}
    </div>
  );
}

function ProductCard({ p, inCartQty, setActiveProduct, addToCart, setQty }) {
  const [spot, setSpot] = useState({ x: "50%", y: "50%" });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    setSpot({ x: `${e.clientX - r.left}px`, y: `${e.clientY - r.top}px` });
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: px * 6, y: -py * 6 });
  }
  function onLeave() { setTilt({ x: 0, y: 0 }); }

  return (
    <div
      onMouseMove={onMove} onMouseLeave={onLeave}
      style={{
        backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        backgroundImage: `radial-gradient(220px circle at ${spot.x} ${spot.y}, rgba(138,106,46,0.08), transparent 70%)`,
        border: "1px solid #D7DCE3", overflow: "hidden",
        transform: `perspective(900px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) translateY(${tilt.x || tilt.y ? -3 : 0}px)`,
        transition: "transform 0.15s ease-out, box-shadow 0.2s ease, border-color 0.2s ease",
        boxShadow: tilt.x || tilt.y ? "0 16px 32px -18px rgba(16,21,31,0.35)" : "none",
      }}
      className="rounded-none flex flex-col group"
    >
      <button onClick={() => setActiveProduct(p)} className="text-left relative overflow-hidden">
        <div className="transition-transform duration-300 group-hover:scale-105">
          <ProductThumb product={p} />
        </div>
        {inCartQty > 0 && (
          <span style={{ backgroundColor: "#8A6A2E", color: "#FFFFFF" }} className="absolute top-1.5 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded-none flex items-center gap-1">
            <Check size={10} /> In cart
          </span>
        )}
      </button>
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div>
          <div className="font-display font-semibold text-sm">{p.name}</div>
          <div className="text-[11px] text-[#10151F]/50 font-mono mt-0.5">{p.dim}</div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 bg-[#F4F5F8] border border-[#D7DCE3] rounded-none text-[#10151F]/70">{p.material}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#D6E9E7] text-[#0E6B62] rounded-none">{p.sterile}</span>
        </div>
        <button onClick={() => setActiveProduct(p)} className="text-[11px] flex items-center gap-1 font-medium" style={{ color: "#8A6A2E" }}>
          View details <ChevronRight size={12} className="transition-transform duration-200 group-hover:translate-x-1" />
        </button>
        <div className="mt-auto pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-mono font-medium text-sm">{money(p.price)}</div>
            <div className="text-[10px] text-[#10151F]/40">MOQ {p.moq} {p.moq > 1 ? "units" : "unit"}</div>
          </div>
          {inCartQty > 0 ? (
            <div className="flex items-center justify-between gap-2 bg-[#D6E9E7] rounded-none px-2 py-1.5">
              <span className="text-[11px] font-medium text-[#0E6B62] flex items-center gap-1"><Check size={12} strokeWidth={3} /> In cart</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setQty(p.id, inCartQty - p.moq)} className="w-6 h-6 bg-white border border-[#D7DCE3] rounded-none flex items-center justify-center"><Minus size={12} /></button>
                <span className="font-mono text-xs w-6 text-center">{inCartQty}</span>
                <button onClick={() => setQty(p.id, inCartQty + p.moq)} className="w-6 h-6 bg-white border border-[#D7DCE3] rounded-none flex items-center justify-center"><Plus size={12} /></button>
              </div>
            </div>
          ) : (
            <MagneticButton
              onClick={() => addToCart(p)}
              style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }}
              className="w-full text-xs font-semibold px-3 py-2 rounded-none hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
            >
              <ShoppingCart size={13} /> Add to Cart
            </MagneticButton>
          )}
        </div>
      </div>
    </div>
  );
}

/* Subtle "magnetic" hover — nudges toward the cursor within its own bounds. */
function MagneticButton({ children, style, className, onClick }) {
  const ref = useRef(null);
  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.25;
    el.style.transform = `translate(${x}px, ${y}px)`;
  }
  function onLeave() { if (ref.current) ref.current.style.transform = ""; }
  return (
    <button ref={ref} onClick={onClick} onMouseMove={onMove} onMouseLeave={onLeave} style={{ ...style, transition: "transform 0.15s ease-out" }} className={className}>
      {children}
    </button>
  );
}

function CatalogView({ client, logout, cat, setCat, query, setQuery, sortOrder, setSortOrder, categories, filtered, products, heroSelection, addToCart, setQty, cart, activeProduct, setActiveProduct, closeProduct, cartCount, setCartOpen, goMyOrders, openProfile, siteSettings }) {
  const [spot, setSpot] = useState({ x: "50%", y: "50%" });
  function onHeroMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    setSpot({ x: `${e.clientX - r.left}px`, y: `${e.clientY - r.top}px` });
  }
  const heroEyebrowBadges = siteSettings && siteSettings.heroEyebrowBadges;
  const statsSection = siteSettings && siteSettings.statsSection;
  const trustBadges = siteSettings && siteSettings.trustBadges;
  const marqueeText = siteSettings && siteSettings.marqueeText;

  return (
    <div>
      <TopHeader client={client} logout={logout} cartCount={cartCount} setCartOpen={setCartOpen} goMyOrders={goMyOrders} openProfile={openProfile} />

      {/* Hero — blueprint thesis */}
      <section onMouseMove={onHeroMove} className="relative border-b border-[#D7DCE3] overflow-hidden" style={{
        backgroundImage: `radial-gradient(320px circle at ${spot.x} ${spot.y}, rgba(138,106,46,0.12), transparent 70%)`,
      }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid sm:grid-cols-2 gap-8 items-center relative">
          <div className="meridian-fade-up">
            <EyebrowBadges badges={heroEyebrowBadges} />
            <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-[#10151F]">
              <span style={{ background: "linear-gradient(100deg, #8A6A2E, #1E3A5F)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Implants</span> engineered to spec.<br />Ordered without a middleman.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#10151F]/70 max-w-md">
              {client ? `Welcome back, ${client.name.split(" ")[0]}. Browse` : "Browse"} our trauma plates, nails, and fixation screws with full technical specs, and order directly — no sales commission built into your price.
            </p>
            <div className="mt-6 flex items-center gap-4 text-xs font-mono text-[#10151F]/60">
              <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-[#8A6A2E]" /> Ti-6Al-4V &amp; 316L stock</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-[#8A6A2E]" /> Gamma / ETO sterilized</span>
            </div>
          </div>
          <HeroCarousel products={products} heroSelection={heroSelection} />
        </div>
      </section>

      <MarqueeStrip text={marqueeText} />
      <StatsSection stats={statsSection} />
      <TrustBadgesRow badges={trustBadges} />

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {["All", ...categories].map((c) => {
              const selected = cat === c;
              return (
                <button key={c} type="button" onClick={() => setCat(c)} style={selected ? SELECTED_STYLE : undefined} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs border-2 flex items-center gap-1 transition-all ${selected ? "font-semibold shadow-sm" : "bg-white text-[#10151F]/70 border-[#D7DCE3] hover:border-[#1E3A5F]/50 font-medium"}`}>
                    {selected && <Check size={12} strokeWidth={3} />}
                    {c}
                  </button>
              );
            })}
          </div>
          <div className="text-[11px] text-[#8A6A2E] font-mono mt-1">Showing: {cat}</div>
        </div>
        <div className="flex items-center gap-2">
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ color: "#10151F" }} aria-label="Sort products" className="text-sm rounded-none border border-[#D7DCE3] bg-white px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40">
            <option value="default">Sort: Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#10151F]/40" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product or code…" aria-label="Search products" className="pl-8 pr-3 py-2 text-sm rounded-none border border-[#D7DCE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40 w-full sm:w-56" />
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const inCartQty = cart[p.id] || 0;
          return <ProductCard key={p.id} p={p} inCartQty={inCartQty} setActiveProduct={setActiveProduct} addToCart={addToCart} setQty={setQty} />;
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-sm text-[#10151F]/50">No products match "{query}".</div>
        )}
      </main>

      <SiteFooter settings={siteSettings} />

      {activeProduct && (
        <ProductModal
          product={activeProduct} inCartQty={cart[activeProduct.id] || 0}
          onClose={closeProduct}
          onAdd={(p) => { addToCart(p); closeProduct(); }}
        />
      )}
    </div>
  );
}

function TopHeader({ client, logout, cartCount, setCartOpen, goMyOrders, openProfile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header style={{
      backgroundColor: "rgba(30,58,95,0.85)", color: "#FFFFFF",
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      boxShadow: scrolled ? "0 8px 30px -14px rgba(0,0,0,0.35)" : "none",
      transition: "box-shadow 0.3s ease",
    }} className="sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-none border border-white/30 flex items-center justify-center font-mono text-[10px]">OI</div>
          <div>
            <div className="font-display font-semibold text-sm sm:text-base leading-tight">Meridian Orthopaedics</div>
            <div style={{ color: "rgba(255,255,255,0.6)" }} className="text-[10px] tracking-widest uppercase">Implant Manufacturing</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {client && (
            <button onClick={goMyOrders} style={{ color: "rgba(255,255,255,0.85)" }} className="flex items-center gap-1 text-xs hover:text-white transition-colors px-2 py-1.5 rounded-none hover:bg-white/10">
              <ListOrdered size={16} /> <span className="hidden sm:inline">My Orders</span>
            </button>
          )}
          <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 bg-[#8A6A2E] hover:bg-[#6F5624] transition-colors px-3 py-2 rounded-none text-sm font-medium">
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-[#E9E2D0] text-[#10151F] text-[10px] font-mono w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}
          </button>
          {client ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Open profile menu" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><User size={14} /></button>
              {menuOpen && (
                <div style={{ backgroundColor: "#FFFFFF", color: "#10151F" }} className="absolute right-0 top-10 rounded-none border border-[#D7DCE3] w-48 py-1 shadow-lg z-40">
                  <div className="px-3 py-2 text-xs border-b border-[#D7DCE3]">
                    <div className="font-medium truncate">{client.name}</div>
                    <div style={{ color: "rgba(23,30,34,0.5)" }} className="truncate">{client.email}</div>
                  </div>
                  <button onClick={() => { setMenuOpen(false); openProfile(); }} style={{ color: "#10151F" }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#F4F5F8] flex items-center gap-2"><User size={13} /> View Profile</button>
                  <button onClick={logout} style={{ color: "#DC2626" }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#F4F5F8] flex items-center gap-2 border-t border-[#D7DCE3]"><LogOut size={13} /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={openProfile} style={{ backgroundColor: "rgba(255,255,255,0.12)" }} className="flex items-center gap-1.5 text-xs font-medium hover:bg-white/20 transition-colors px-3 py-2 rounded-none">
              <User size={14} /> <span>Register / Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const TERMS_TEXT = `These Terms & Conditions are placeholder text — replace with content reviewed by your legal counsel before going live.

1. Orders placed through this platform are subject to confirmation by Meridian Orthopaedics and are not final until a Confirmed status is issued.
2. Minimum order quantities (MOQ) shown per product apply to all orders.
3. Prices are shown in PKR and are subject to change without prior notice; the price at the time of order confirmation applies.
4. Cancellations are only accepted while an order is in Pending status.
5. All implants are supplied sterile as indicated (Gamma or ETO) and should be stored per manufacturer guidelines.`;

const PRIVACY_TEXT = `This Privacy Policy is placeholder text — replace with content reviewed by your legal counsel before going live.

1. We collect the contact, facility, and license information you provide at registration to process your orders.
2. Your password is stored in hashed form and is never visible to our staff.
3. We do not sell or share your information with third parties outside of fulfilling your orders.
4. You may request a copy of your data or its deletion by contacting us using the details in the footer.`;

const DEFAULT_SITE_SETTINGS = {
  email: "sales@meridianortho.pk",
  phone: "+92 300 0000000",
  terms: TERMS_TEXT,
  privacy: PRIVACY_TEXT,
  heroEyebrowBadges: [],
  statsSection: [],
  trustBadges: [],
};

function SiteFooter({ settings }) {
  const [modal, setModal] = useState(null); // "terms" | "privacy" | null
  return (
    <>
      <footer className="border-t border-[#D7DCE3] mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid sm:grid-cols-3 gap-4 text-xs text-[#10151F]/60">
          <div>
            <div className="font-display font-semibold text-[#10151F] mb-1">Meridian Orthopaedics</div>
            <div>Implant Manufacturing — direct from the manufacturer.</div>
          </div>
          <div>
            <div className="font-medium text-[#10151F]/80 mb-1">Contact</div>
            <div className="flex items-center gap-1.5"><Mail size={12} /> {settings.email}</div>
            <div className="flex items-center gap-1.5 mt-0.5"><Phone size={12} /> {settings.phone}</div>
          </div>
          <div>
            <div className="font-medium text-[#10151F]/80 mb-1">Legal</div>
            <button onClick={() => setModal("terms")} className="block hover:underline text-left">Terms &amp; Conditions</button>
            <button onClick={() => setModal("privacy")} className="block hover:underline text-left mt-0.5">Privacy Policy</button>
          </div>
        </div>
        <div className="border-t border-[#D7DCE3]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 text-[11px] text-[#10151F]/40">© {new Date().getFullYear()} Meridian Orthopaedics</div>
        </div>
      </footer>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setModal(null)}>
          <div style={{ maxHeight: "85vh", overflowY: "auto", color: "#10151F" }} className="bg-white w-full sm:max-w-lg sm:rounded-none rounded-t-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#D7DCE3]">
              <div className="font-display font-semibold">{modal === "terms" ? "Terms & Conditions" : "Privacy Policy"}</div>
              <button onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-4 text-xs whitespace-pre-line" style={{ color: "rgba(23,30,34,0.75)" }}>
              {modal === "terms" ? settings.terms : settings.privacy}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProductModal({ product, inCartQty, onClose, onAdd }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div style={{ maxHeight: "90vh", overflowY: "auto" }} className="bg-white w-full sm:max-w-lg sm:rounded-none rounded-t-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#D7DCE3]">
          <span className="font-mono text-xs text-[#10151F]/50">{product.id}</span>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <ProductThumb product={product} />
        <div className="p-5 space-y-3">
          <div>
            <div className="font-display font-semibold text-lg">{product.name}</div>
            <div className="text-xs text-[#10151F]/50">{product.cat}</div>
          </div>
          <dl className="text-sm grid grid-cols-2 gap-y-2">
            <dt className="text-[#10151F]/50">Material</dt><dd className="font-medium">{product.material}</dd>
            <dt className="text-[#10151F]/50">Dimensions</dt><dd className="font-mono">{product.dim}</dd>
            <dt className="text-[#10151F]/50">Sterilization</dt><dd>{product.sterile}</dd>
            <dt className="text-[#10151F]/50">Minimum order</dt><dd>{product.moq} units</dd>
          </dl>
          <div className="flex items-center justify-between pt-2 border-t border-[#D7DCE3]">
            <div className="font-mono font-semibold text-lg">{money(product.price)}</div>
            {inCartQty > 0 ? (
              <span className="text-sm text-[#8A6A2E] font-medium flex items-center gap-1"><Check size={14} /> {inCartQty} in cart</span>
            ) : (
              <button onClick={() => onAdd(product)} style={{ backgroundColor: "#8A6A2E", color: "#FFFFFF" }} className="px-4 py-2 rounded-none text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
                <ShoppingCart size={14} /> Add to cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ cartItems, cartTotal, setQty, onClose, onCheckout }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="bg-white w-full sm:w-[380px] h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#D7DCE3]">
          <div className="font-display font-semibold flex items-center gap-2"><ShoppingCart size={16} /> Your cart</div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 && <div className="text-sm text-[#10151F]/50 text-center py-10">Cart is empty.</div>}
          {cartItems.map(({ product, qty }) => (
            <div key={product.id} className="flex gap-3 border border-[#D7DCE3] rounded-none p-2.5">
              <div className="w-14 h-14 shrink-0"><ProductThumb product={product} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{product.name}</div>
                <div className="font-mono text-xs text-[#10151F]/50">{money(product.price)} · MOQ {product.moq}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <button onClick={() => setQty(product.id, qty - product.moq)} className="w-6 h-6 border border-[#D7DCE3] rounded-none flex items-center justify-center"><Minus size={12} /></button>
                  <span className="font-mono text-sm w-8 text-center">{qty}</span>
                  <button onClick={() => setQty(product.id, qty + product.moq)} className="w-6 h-6 border border-[#D7DCE3] rounded-none flex items-center justify-center"><Plus size={12} /></button>
                  <button onClick={() => setQty(product.id, 0)} className="ml-auto text-[#10151F]/40 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-[#D7DCE3] space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#10151F]/60">Total</span>
              <span className="font-mono font-semibold text-base">{money(cartTotal)}</span>
            </div>
            <button onClick={onCheckout} style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="w-full py-2.5 rounded-none text-sm font-medium hover:opacity-90 transition-opacity">
              Proceed to order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutModal({ client, cartItems, cartTotal, setQty, onClose, onSubmit }) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const empty = cartItems.length === 0;
  const disabled = submitting || empty;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div style={{ maxHeight: "92vh", overflowY: "auto" }} className="bg-white w-full sm:max-w-lg sm:rounded-none rounded-t-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#D7DCE3]">
          <div className="font-display font-semibold flex items-center gap-2"><ClipboardList size={16} /> Review &amp; confirm order</div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40 mb-1.5">Your items — adjust quantity or remove before confirming</div>
            <div className="border border-[#D7DCE3] rounded-none divide-y divide-[#D7DCE3] max-h-64 overflow-y-auto">
              {empty && <div className="p-4 text-xs text-center text-[#10151F]/50">Your cart is empty.</div>}
              {cartItems.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-2 p-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{product.name}</div>
                    <div className="font-mono text-[11px] text-[#10151F]/50">{product.id} · {money(product.price)} each</div>
                  </div>
                  <button onClick={() => setQty(product.id, qty - product.moq)} className="w-6 h-6 border border-[#D7DCE3] rounded-none flex items-center justify-center shrink-0"><Minus size={12} /></button>
                  <span className="font-mono text-xs w-6 text-center shrink-0">{qty}</span>
                  <button onClick={() => setQty(product.id, qty + product.moq)} className="w-6 h-6 border border-[#D7DCE3] rounded-none flex items-center justify-center shrink-0"><Plus size={12} /></button>
                  <span className="font-mono text-xs w-20 text-right shrink-0">{money(product.price * qty)}</span>
                  <button onClick={() => setQty(product.id, 0)} className="text-[#10151F]/40 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            {!empty && (
              <div className="flex justify-between text-sm font-semibold pt-2">
                <span>Total</span><span className="font-mono">{money(cartTotal)}</span>
              </div>
            )}
          </div>

          <div className="border border-[#D7DCE3] rounded-none p-3 text-xs space-y-0.5">
            <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40 mb-1">Delivering to</div>
            <div className="font-medium text-sm">{client.name} · {client.type}</div>
            {client.facility && <div>{client.facility}</div>}
            <div className="font-mono">{client.phone}</div>
            <div>{client.address}, {client.city}</div>
          </div>

          <textarea placeholder="Order notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-sm border border-[#D7DCE3] rounded-none p-2.5 focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40" rows={2} />

          <div className="bg-[#D6E9E7] text-[#0E6B62] text-xs rounded-none p-2.5">Payment: Cash on Delivery or Bank Transfer — our team will confirm details by phone after you place the order. You can cancel this order from "My Orders" any time before it's confirmed.</div>

          <button
            disabled={disabled}
            onClick={async () => { setSubmitting(true); await onSubmit({ notes }); setSubmitting(false); }}
            style={!disabled ? { backgroundColor: "#8A6A2E", color: "#FFFFFF" } : undefined}
            className={`w-full py-2.5 rounded-none text-sm font-medium transition-colors ${disabled ? "bg-[#F4F5F8] text-[#10151F]/40" : "hover:opacity-90"}`}
          >
            {empty ? "Cart is empty" : submitting ? "Placing order…" : "Confirm & place order"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = props.type === "password";
  return (
    <div className="relative">
      <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#10151F]/35" />
      <input {...props} type={isPassword && show ? "text" : props.type} onChange={(e) => props.onChange(e.target.value)} className={`w-full pl-8 ${isPassword ? "pr-9" : "pr-3"} py-2.5 text-sm border rounded-none focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40 ${props.disabled ? "bg-[#F4F5F8] text-[#10151F]/40 border-[#D7DCE3]" : "border-[#D7DCE3]"}`} />
      {isPassword && (
        <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#10151F]/40 hover:text-[#10151F]/70">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
  );
}

function BarePasswordInput({ className, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${className} pr-9`} />
      <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#10151F]/40 hover:text-[#10151F]/70">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function OrderConfirmModal({ order, onClose, onViewOrders }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white max-w-sm w-full rounded-none p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 mx-auto rounded-full bg-[#D6E9E7] flex items-center justify-center mb-3">
          <CheckCircle2 className="text-[#8A6A2E]" size={24} />
        </div>
        <div className="font-display font-semibold text-lg">Order placed</div>
        <div className="font-mono text-xs text-[#10151F]/50 mt-1">{order.orderId}</div>
        <p className="text-sm text-[#10151F]/60 mt-3">Our team will call to confirm and arrange Cash on Delivery / Bank Transfer. You can cancel anytime before it's confirmed, from My Orders.</p>
        {order.saveFailed && <p className="text-xs text-amber-600 mt-2">Note: order recorded locally — please also share your order ID directly with our team.</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#D7DCE3] rounded-none text-sm font-medium">Close</button>
          <button onClick={onViewOrders} style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="flex-1 py-2.5 rounded-none text-sm font-medium hover:opacity-90 transition-opacity">View my orders</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Profile (view/edit own details, change password) ---------------- */

function ProfileModal({ client, orderCount, onClose, onSave, onChangePassword, onLogout }) {
  const [mode, setMode] = useState("view"); // view | edit | password
  const [form, setForm] = useState({ name: client.name, type: client.type, facility: client.facility || "", license: client.license || "", phone: client.phone, city: client.city, address: client.address });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const missingEditFields = [
    !form.name && "name",
    !form.type && "account type",
    !form.phone && "phone",
    !form.city && "city",
    !form.address && "address",
  ].filter(Boolean);
  const canSaveEdit = missingEditFields.length === 0;

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await onSave(form);
    setSaving(false);
    if (res.ok) setMode("view");
    else setError(res.error);
  }

  async function handleChangePassword() {
    setPwError("");
    setPwSuccess(false);
    if (!pwForm.current || !pwForm.next) { setPwError("Fill in all fields."); return; }
    if (pwForm.next.length < 4) { setPwError("New password must be at least 4 characters."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("New passwords don't match."); return; }
    setSaving(true);
    const res = await onChangePassword(pwForm.current, pwForm.next);
    setSaving(false);
    if (res.ok) { setPwSuccess(true); setPwForm({ current: "", next: "", confirm: "" }); }
    else setPwError(res.error);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div style={{ maxHeight: "92vh", overflowY: "auto", backgroundColor: "#FFFFFF", color: "#10151F" }} className="w-full sm:max-w-lg sm:rounded-none rounded-t-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#D7DCE3]">
          <div className="font-display font-semibold flex items-center gap-2">
            <User size={16} />
            {mode === "view" ? "My Profile" : mode === "edit" ? "Edit Profile" : "Change Password"}
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {mode === "view" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="w-12 h-12 rounded-full flex items-center justify-center font-display font-semibold text-lg shrink-0">
                {client.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <div className="font-display font-semibold text-base truncate">{client.name}</div>
                <div style={{ color: "rgba(23,30,34,0.5)" }} className="text-xs flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span style={{ backgroundColor: "#D6E9E7", color: "#0E6B62" }} className="text-[10px] px-1.5 py-0.5 rounded-none">{client.type}</span>
                  {client.createdAt && <span>Client since {new Date(client.createdAt).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Orders placed" value={orderCount} mono />
              <StatCard label="Account type" value={client.type} />
            </div>

            <div className="border border-[#D7DCE3] rounded-none divide-y divide-[#D7DCE3]">
              <ProfileRow icon={Mail} label="Email" value={client.email} />
              <ProfileRow icon={Phone} label="Phone" value={client.phone} />
              {client.facility && <ProfileRow icon={Building2} label="Facility / Business" value={client.facility} />}
              {client.license && <ProfileRow icon={CreditCard} label="License No." value={client.license} />}
              <ProfileRow icon={MapPin} label="City" value={client.city} />
              <ProfileRow icon={MapPin} label="Address" value={client.address} />
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setForm({ name: client.name, type: client.type, facility: client.facility || "", license: client.license || "", phone: client.phone, city: client.city, address: client.address }); setError(""); setMode("edit"); }} style={{ color: "#10151F" }} className="flex-1 py-2.5 border border-[#D7DCE3] rounded-none text-sm font-medium hover:bg-[#F4F5F8] transition-colors">
                Edit Details
              </button>
              <button onClick={() => { setPwForm({ current: "", next: "", confirm: "" }); setPwError(""); setPwSuccess(false); setMode("password"); }} style={{ color: "#10151F" }} className="flex-1 py-2.5 border border-[#D7DCE3] rounded-none text-sm font-medium hover:bg-[#F4F5F8] transition-colors flex items-center justify-center gap-1.5">
                <Lock size={13} /> Change Password
              </button>
            </div>
            <button onClick={onLogout} style={{ color: "#DC2626" }} className="w-full py-2.5 rounded-none text-sm font-medium border border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
              <LogOut size={13} /> Log out
            </button>
          </div>
        )}

        {mode === "edit" && (
          <div className="p-4 space-y-3">
            <div style={{ color: "rgba(23,30,34,0.4)" }} className="text-[11px] -mt-1 mb-1">Email can't be changed. Contact us if you need it updated.</div>
            <Field icon={User} placeholder="Contact person name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <SelectPills label="Account type" options={CLIENT_TYPES} value={form.type} onChange={(t) => setForm({ ...form, type: t })} />
            <Field icon={Building2} placeholder="Facility / business name" value={form.facility} onChange={(v) => setForm({ ...form, facility: v })} />
            <Field icon={CreditCard} placeholder="Business / drug license no. (optional)" value={form.license} onChange={(v) => setForm({ ...form, license: v })} />
            <Field icon={Phone} placeholder="Phone number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field icon={MapPin} placeholder="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Field icon={MapPin} placeholder="Full address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            {error && <div className="text-xs text-red-500">{error}</div>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setMode("view")} style={{ color: "#10151F" }} className="flex-1 py-2.5 border border-[#D7DCE3] rounded-none text-sm font-medium">Cancel</button>
              <button
                disabled={!canSaveEdit || saving}
                onClick={handleSave}
                style={canSaveEdit && !saving ? { backgroundColor: "#8A6A2E", color: "#FFFFFF" } : { backgroundColor: "#F4F5F8", color: "rgba(23,30,34,0.4)" }}
                className="flex-1 py-2.5 rounded-none text-sm font-semibold transition-colors hover:opacity-90"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
            {!canSaveEdit && <div style={{ color: "rgba(23,30,34,0.4)" }} className="text-[11px] text-center">Fill in: {missingEditFields.join(", ")}</div>}
          </div>
        )}

        {mode === "password" && (
          <div className="p-4 space-y-3">
            {pwSuccess && (
              <div style={{ backgroundColor: "#D6E9E7", color: "#0E6B62" }} className="text-xs rounded-none p-2.5 flex items-center gap-1.5"><CheckCircle2 size={14} /> Password updated successfully.</div>
            )}
            <Field icon={Lock} type="password" placeholder="Current password" value={pwForm.current} onChange={(v) => setPwForm({ ...pwForm, current: v })} />
            <Field icon={Lock} type="password" placeholder="New password (4+ characters)" value={pwForm.next} onChange={(v) => setPwForm({ ...pwForm, next: v })} />
            <Field icon={Lock} type="password" placeholder="Confirm new password" value={pwForm.confirm} onChange={(v) => setPwForm({ ...pwForm, confirm: v })} />
            {pwError && <div className="text-xs text-red-500">{pwError}</div>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setMode("view")} style={{ color: "#10151F" }} className="flex-1 py-2.5 border border-[#D7DCE3] rounded-none text-sm font-medium">Back</button>
              <button
                disabled={saving}
                onClick={handleChangePassword}
                style={!saving ? { backgroundColor: "#1E3A5F", color: "#FFFFFF" } : { backgroundColor: "#F4F5F8", color: "rgba(23,30,34,0.4)" }}
                className="flex-1 py-2.5 rounded-none text-sm font-semibold transition-colors hover:opacity-90"
              >
                {saving ? "Updating…" : "Update password"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <Icon size={14} style={{ color: "rgba(23,30,34,0.35)" }} className="shrink-0" />
      <div className="min-w-0">
        <div style={{ color: "rgba(23,30,34,0.4)" }} className="text-[10px] uppercase tracking-wide">{label}</div>
        <div className="text-sm truncate">{value}</div>
      </div>
    </div>
  );
}

/* ---------------- My Orders (client) ---------------- */

function MyOrdersView({ client, orders, loading, onCancel, goCatalog, logout, cartCount, setCartOpen, goMyOrders, openProfile, siteSettings }) {
  const [confirmCancel, setConfirmCancel] = useState(null); // orderId pending cancel confirmation
  return (
    <div className="min-h-screen">
      <TopHeader client={client} logout={logout} cartCount={cartCount} setCartOpen={setCartOpen} goMyOrders={goMyOrders} openProfile={openProfile} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={goCatalog} className="flex items-center gap-1 text-xs text-[#10151F]/50 mb-4"><ArrowLeft size={13} /> Back to store</button>
        <div className="font-display font-semibold text-xl mb-1 flex items-center gap-2"><ListOrdered size={18} /> My Orders</div>
        <p className="text-sm text-[#10151F]/50 mb-5">Track your orders, or cancel one before it's confirmed.</p>

        {loading && <div className="text-sm text-[#10151F]/50 py-10 text-center">Loading your orders…</div>}
        {!loading && orders.length === 0 && (
          <div className="text-sm text-[#10151F]/50 py-16 text-center border border-dashed border-[#D7DCE3] rounded-none">You haven't placed any orders yet.</div>
        )}

        <div className="space-y-3">
          {orders.map((o) => {
            const Icon = STATUS_ICON[o.status];
            return (
              <div key={o.orderId} className="bg-white border border-[#D7DCE3] rounded-none p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-none flex items-center justify-center ${STATUS_COLOR[o.status]}`}><Icon size={14} /></div>
                    <div>
                      <div className="font-mono text-xs text-[#10151F]/50">{o.orderId}</div>
                      <div className="text-[10px] text-[#10151F]/40">{new Date(o.ts).toLocaleString()}</div>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]}`}>{o.status}</span>
                </div>
                <div className="text-xs font-mono space-y-0.5 border-t border-[#D7DCE3] pt-2 mt-2">
                  {o.items.map((it) => (
                    <div key={it.id} className="flex justify-between"><span>{it.id} × {it.qty}</span><span>{money(it.price * it.qty)}</span></div>
                  ))}
                  <div className="flex justify-between font-semibold pt-1 border-t border-[#D7DCE3] mt-1"><span>Total</span><span>{money(o.total)}</span></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => printOrderInvoice(o)} className="flex-1 py-2 border border-[#D7DCE3] rounded-none text-xs font-medium hover:bg-[#F4F5F8] transition-colors flex items-center justify-center gap-1.5">
                    <Printer size={13} /> Print
                  </button>
                  {o.status === "Pending" && (
                    <button onClick={() => setConfirmCancel(o.orderId)} className="flex-1 py-2 border border-red-200 text-red-500 rounded-none text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                      <XCircle size={13} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <SiteFooter settings={siteSettings} />

      {confirmCancel && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={() => setConfirmCancel(null)}>
          <div style={{ color: "#10151F" }} className="bg-white max-w-xs w-full rounded-none p-5" onClick={(e) => e.stopPropagation()}>
            <div className="font-display font-semibold text-base mb-1">Cancel this order?</div>
            <p className="text-xs text-[#10151F]/50 mb-4">This can't be undone. You'll need to place a new order if you change your mind.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmCancel(null)} style={{ color: "#10151F" }} className="flex-1 py-2 border border-[#D7DCE3] rounded-none text-xs font-medium">Keep order</button>
              <button onClick={() => { onCancel(confirmCancel); setConfirmCancel(null); }} style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }} className="flex-1 py-2 rounded-none text-xs font-semibold">Cancel order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Admin ---------------- */

function AdminView({ adminAuthed, adminPass, setAdminPass, adminError, setAdminError, setAdminAuthed, orders, ordersLoading, statusFilter, setStatusFilter, updateStatus, goCatalog, reload, products, addProduct, updateProduct, deleteProduct, toggleHideProduct, productBusy, productError, setProductError, heroSelection, saveHeroSelection, categories, addCategory, siteSettings, updateSiteSettings, changeAdminPasscode, resetPasscodeWithRecoveryCode, regenerateRecoveryCode }) {
  const [tab, setTab] = useState("orders"); // orders | products | hero
  const [checking, setChecking] = useState(false);

  const [gateMode, setGateMode] = useState("login"); // login | recover
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [recoverError, setRecoverError] = useState("");
  const [recoverBusy, setRecoverBusy] = useState(false);
  const [issuedCode, setIssuedCode] = useState(null); // the freshly-generated code shown once after a successful recovery

  async function tryEnter() {
    setChecking(true);
    const r = await api("adminLogin", { passcode: adminPass });
    setChecking(false);
    if (r && r.ok) {
      setAdminTokenStorage(r.token);
      setAdminAuthed(true);
      setAdminError("");
      setAdminPass("");
    } else {
      setAdminError((r && r.error) || "Incorrect passcode");
    }
  }

  async function handleRecover() {
    setRecoverError("");
    if (!recoveryCode) { setRecoverError("Enter your recovery code."); return; }
    if (!newPasscode || newPasscode.length < 4) { setRecoverError("New passcode must be at least 4 characters."); return; }
    if (newPasscode !== confirmPasscode) { setRecoverError("New passcodes don't match."); return; }
    setRecoverBusy(true);
    const res = await resetPasscodeWithRecoveryCode(recoveryCode, newPasscode);
    setRecoverBusy(false);
    if (res.ok) { setIssuedCode(res.newCode); setAdminAuthed(true); }
    else setRecoverError(res.error);
  }

  if (!adminAuthed) {
    if (gateMode === "recover") {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-sm w-full">
            <button onClick={() => { setGateMode("login"); setIssuedCode(null); setRecoverError(""); }} className="flex items-center gap-1 text-xs text-[#10151F]/50 mb-6"><ArrowLeft size={13} /> Back to passcode entry</button>
            <div style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="w-10 h-10 rounded-none flex items-center justify-center mb-4"><Lock size={16} /></div>
            <div className="font-display font-semibold text-xl mb-1">Recover admin access</div>

            {issuedCode ? (
              <div className="space-y-3">
                <div style={{ backgroundColor: "#D6E9E7", color: "#0E6B62" }} className="text-xs rounded-none p-2.5 flex items-center gap-1.5"><CheckCircle2 size={14} /> Passcode reset. Save your new recovery code below — it won't be shown again.</div>
                <div className="border-2 border-dashed border-[#D7DCE3] rounded-none p-4 text-center font-mono text-lg tracking-wider">{issuedCode}</div>
                <button onClick={() => { navigator.clipboard?.writeText(issuedCode); }} className="w-full py-2 border border-[#D7DCE3] rounded-none text-xs font-medium hover:bg-[#F4F5F8]">Copy code</button>
                <button onClick={() => { setGateMode("login"); setIssuedCode(null); setRecoveryCode(""); setNewPasscode(""); setConfirmPasscode(""); }} style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="w-full py-2.5 rounded-none text-sm font-medium hover:opacity-90">Continue to login</button>
              </div>
            ) : (
              <>
                <p className="text-sm text-[#10151F]/50 mb-4">Enter your recovery code and choose a new passcode.</p>
                <input value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} placeholder="Recovery code (e.g. ABCD-1234-EFGH)" aria-label="Recovery code" className="w-full px-3 py-2.5 text-sm border border-[#D7DCE3] rounded-none mb-2 font-mono focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40" />
                <BarePasswordInput value={newPasscode} onChange={(e) => setNewPasscode(e.target.value)} placeholder="New passcode" aria-label="New passcode" className="w-full px-3 py-2.5 text-sm border border-[#D7DCE3] rounded-none mb-2 focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40" />
                <BarePasswordInput value={confirmPasscode} onChange={(e) => setConfirmPasscode(e.target.value)} placeholder="Confirm new passcode" aria-label="Confirm new passcode" className="w-full px-3 py-2.5 text-sm border border-[#D7DCE3] rounded-none mb-2 focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40" />
                {recoverError && <div className="text-xs text-red-500 mb-2">{recoverError}</div>}
                <button onClick={handleRecover} disabled={recoverBusy} style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="w-full py-2.5 rounded-none text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60">{recoverBusy ? "Resetting…" : "Reset passcode"}</button>
              </>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <button onClick={goCatalog} className="flex items-center gap-1 text-xs text-[#10151F]/50 mb-6"><ArrowLeft size={13} /> Back to store</button>
          <div style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="w-10 h-10 rounded-none flex items-center justify-center mb-4"><Lock size={16} /></div>
          <div className="font-display font-semibold text-xl mb-1">Admin dashboard</div>
          <p className="text-sm text-[#10151F]/50 mb-4">Enter the admin passcode to continue.</p>
          <BarePasswordInput value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="Passcode" aria-label="Admin passcode" className="w-full px-3 py-2.5 text-sm border border-[#D7DCE3] rounded-none mb-2 focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40" onKeyDown={(e) => e.key === "Enter" && !checking && tryEnter()} />
          {adminError && <div className="text-xs text-red-500 mb-2">{adminError}</div>}
          <button onClick={tryEnter} disabled={checking} style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="w-full py-2.5 rounded-none text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60">{checking ? "Checking…" : "Enter"}</button>
          <button onClick={() => { setGateMode("recover"); setRecoverError(""); setRecoveryCode(""); setNewPasscode(""); setConfirmPasscode(""); setIssuedCode(null); }} className="w-full text-center text-xs text-[#10151F]/50 hover:underline mt-3">Forgot passcode?</button>
        </div>
      </div>
    );
  }

  const displayed = statusFilter === "All" ? orders : orders.filter((o) => o.status === statusFilter);
  const CONFIRMED_STATUSES = ["Confirmed", "Dispatched", "Delivered"];
  const totalRevenue = orders.filter((o) => CONFIRMED_STATUSES.includes(o.status)).reduce((s, o) => s + o.total, 0);
  const pendingValue = orders.filter((o) => o.status === "Pending").reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "Pending").length;

  function exportOrdersCSV() {
    const header = ["Order ID", "Date", "Customer", "Facility", "Phone", "Email", "City", "Total", "Status"];
    const rows = displayed.map((o) => [
      o.orderId, new Date(o.ts).toLocaleString("en-PK"),
      o.customer?.name || "", o.customer?.facility || "", o.customer?.phone || "",
      o.customer?.email || "", o.customer?.city || "", o.total, o.status,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meridian-orders-${statusFilter.toLowerCase()}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <header style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-semibold text-sm"><LayoutDashboard size={16} /> Admin dashboard</div>
          <div className="flex items-center gap-3">
            <button onClick={goCatalog} style={{ color: "rgba(255,255,255,0.85)" }} className="text-xs hover:text-white flex items-center gap-1"><ArrowLeft size={13} /> Store view</button>
            <button onClick={() => { setAdminTokenStorage(null); setAdminAuthed(false); goCatalog(); }} style={{ color: "rgba(255,255,255,0.85)" }} className="text-xs hover:text-white flex items-center gap-1" aria-label="Log out of admin"><LogOut size={13} /> Log out</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1.5 pb-2">
          {[{ id: "orders", label: "Orders" }, { id: "products", label: "Products" }, { id: "hero", label: "Hero Banner" }, { id: "settings", label: "Site Settings" }].map((t) => {
            const selected = tab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} style={selected ? { backgroundColor: "#FFFFFF", color: "#1E3A5F" } : undefined} className={`px-3 py-1.5 rounded-none text-xs font-semibold transition-colors ${selected ? "" : "bg-white/10 text-white/70 hover:bg-white/15"}`}>
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {tab === "products" ? (
        <ProductsAdminPanel
          products={products} addProduct={addProduct} updateProduct={updateProduct}
          deleteProduct={deleteProduct} toggleHideProduct={toggleHideProduct}
          productBusy={productBusy} productError={productError} setProductError={setProductError}
          categories={categories} addCategory={addCategory}
        />
      ) : tab === "hero" ? (
        <HeroAdminPanel products={products} updateProduct={updateProduct} heroSelection={heroSelection} saveHeroSelection={saveHeroSelection} />
      ) : tab === "settings" ? (
        <SiteSettingsPanel siteSettings={siteSettings} updateSiteSettings={updateSiteSettings} changeAdminPasscode={changeAdminPasscode} regenerateRecoveryCode={regenerateRecoveryCode} />
      ) : (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total orders" value={orders.length} />
            <StatCard label="Pending" value={pendingCount} />
            <StatCard label="Confirmed revenue" value={money(totalRevenue)} mono />
            <StatCard label="Pending value" value={money(pendingValue)} mono />
          </div>

          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {["All", ...ALL_STATUSES].map((s) => {
                  const selected = statusFilter === s;
                  return (
                    <button key={s} type="button" onClick={() => setStatusFilter(s)} style={selected ? SELECTED_STYLE : undefined} className={`whitespace-nowrap px-2.5 py-1.5 rounded-full text-xs border-2 flex items-center gap-1 transition-all ${selected ? "font-semibold shadow-sm" : "bg-white border-[#D7DCE3] text-[#10151F]/60"}`}>
                      {selected && <Check size={11} strokeWidth={3} />}
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] text-[#8A6A2E] font-mono mt-1">Showing: {statusFilter}</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={exportOrdersCSV} className="text-xs px-2.5 py-1.5 border border-[#D7DCE3] rounded-none flex items-center gap-1.5 hover:bg-[#F4F5F8]"><Download size={12} /> Export CSV</button>
              <button onClick={reload} className="text-xs text-[#10151F]/50 underline shrink-0">Refresh</button>
            </div>
          </div>

          {ordersLoading && <div className="text-sm text-[#10151F]/50 py-10 text-center">Loading orders…</div>}
          {!ordersLoading && displayed.length === 0 && (
            <div className="text-sm text-[#10151F]/50 py-16 text-center border border-dashed border-[#D7DCE3] rounded-none">
              No orders yet — place a test order from the store view to see it appear here.
            </div>
          )}

          <div className="space-y-3">
            {displayed.map((o) => (
              <OrderCard key={o.orderId} order={o} updateStatus={updateStatus} />
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

/* ---------------- Admin: Products ---------------- */

function ProductsAdminPanel({ products, addProduct, updateProduct, deleteProduct, toggleHideProduct, productBusy, productError, setProductError, categories, addCategory }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // product being edited, or null for "add new"
  const [confirmDelete, setConfirmDelete] = useState(null); // product id pending delete confirmation
  const [search, setSearch] = useState("");

  function openAdd() { setEditing(null); setProductError(""); setFormOpen(true); }
  function openEdit(p) { setEditing(p); setProductError(""); setFormOpen(true); }

  async function handleSave(form) {
    const ok = editing ? await updateProduct(editing.id, form) : await addProduct(form);
    if (ok) setFormOpen(false);
  }

  const visibleProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="font-display font-semibold text-lg">Product catalog</div>
          <p className="text-xs text-[#10151F]/50 mt-0.5">Add new articles, edit details or photos, or hide items from the store.</p>
        </div>
        <button onClick={openAdd} style={{ backgroundColor: "#8A6A2E", color: "#FFFFFF" }} className="text-xs font-semibold px-3 py-2 rounded-none hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0">
          <Plus size={14} /> Add product
        </button>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#10151F]/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or code…" aria-label="Search products" className="pl-8 pr-3 py-2 text-sm rounded-none border border-[#D7DCE3] bg-white focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40 w-full" />
      </div>

      {visibleProducts.length === 0 && (
        <div className="text-sm text-[#10151F]/50 py-16 text-center border border-dashed border-[#D7DCE3] rounded-none">No products match "{search}".</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleProducts.map((p) => (
          <div key={p.id} className={`bg-white border rounded-none overflow-hidden flex flex-col ${p.hidden ? "border-[#D7DCE3] opacity-60" : "border-[#D7DCE3]"}`}>
            <div className="relative">
              <ProductThumb product={p} />
              {p.hidden && (
                <span style={{ backgroundColor: "#10151F", color: "#FFFFFF" }} className="absolute top-1.5 left-2 text-[10px] font-mono px-1.5 py-0.5 rounded-none">Hidden</span>
              )}
            </div>
            <div className="p-3 flex flex-col gap-1.5 flex-1">
              <div className="font-mono text-[10px] text-[#10151F]/50">{p.id}</div>
              <div className="font-display font-semibold text-sm leading-tight">{p.name}</div>
              <div className="text-[11px] text-[#10151F]/50">{p.cat}</div>
              <div className="font-mono text-sm font-medium mt-auto pt-1.5">{money(p.price)}</div>
              <div className="flex items-center gap-1.5 pt-1.5">
                <button onClick={() => openEdit(p)} className="flex-1 text-xs px-2 py-1.5 border border-[#D7DCE3] rounded-none hover:bg-[#F4F5F8] transition-colors">Edit</button>
                <button onClick={() => toggleHideProduct(p.id)} className="px-2 py-1.5 border border-[#D7DCE3] rounded-none hover:bg-[#F4F5F8] transition-colors" title={p.hidden ? "Unhide" : "Hide"}>
                  {p.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button onClick={() => setConfirmDelete(p.id)} className="px-2 py-1.5 border border-[#D7DCE3] rounded-none hover:bg-red-50 hover:border-red-200 text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-16 text-sm text-[#10151F]/50 border border-dashed border-[#D7DCE3] rounded-none">No products yet — add your first one.</div>
        )}
      </div>

      {formOpen && (
        <ProductFormModal
          product={editing} onClose={() => setFormOpen(false)} onSave={handleSave}
          busy={productBusy} error={productError} categories={categories} addCategory={addCategory}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white max-w-xs w-full rounded-none p-5" onClick={(e) => e.stopPropagation()}>
            <div className="font-display font-semibold text-base mb-1">Delete this product?</div>
            <p className="text-xs text-[#10151F]/50 mb-4">This removes it from the store catalog. This can't be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 border border-[#D7DCE3] rounded-none text-xs font-medium">Cancel</button>
              <button onClick={() => { deleteProduct(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2 bg-red-500 text-white rounded-none text-xs font-medium hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------------- Admin: Hero Banner ---------------- */

function HomepageListEditor({ title, siteSettings, updateSiteSettings, settingsKey, fields, makeBlank }) {
  const [items, setItems] = useState(() => (Array.isArray(siteSettings[settingsKey]) ? siteSettings[settingsKey] : []));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateItem(i, key, value) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
    setSaved(false);
  }
  function addRow() { setItems((prev) => [...prev, makeBlank()]); setSaved(false); }
  function deleteRow(i) { setItems((prev) => prev.filter((_, idx) => idx !== i)); setSaved(false); }

  async function handleSave() {
    setSaving(true); setSaved(false);
    await updateSiteSettings({ [settingsKey]: items });
    setSaving(false); setSaved(true);
  }

  return (
    <div className="border border-[#D7DCE3] rounded-none p-3.5">
      <div className="text-sm font-semibold mb-2.5">{title}</div>
      <div className="space-y-2">
        {items.length === 0 && <div className="text-xs text-[#10151F]/40 italic">No items — showing default content on the site.</div>}
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {fields.map((f) => (
              f.type === "select" ? (
                <select key={f.key} value={item[f.key] || ""} onChange={(e) => updateItem(i, f.key, e.target.value)} style={{ color: "#10151F" }} className="text-xs border border-[#D7DCE3] rounded-none px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40">
                  {f.options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                </select>
              ) : (
                <input key={f.key} value={item[f.key] || ""} onChange={(e) => updateItem(i, f.key, e.target.value)} placeholder={f.label} style={{ color: "#10151F" }} className="flex-1 text-xs border border-[#D7DCE3] rounded-none px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40" />
              )
            ))}
            <button onClick={() => deleteRow(i)} aria-label="Delete item" className="w-8 h-8 shrink-0 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-none"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={addRow} className="text-xs px-2.5 py-1.5 border border-[#D7DCE3] rounded-none flex items-center gap-1.5 hover:bg-[#F4F5F8]"><Plus size={12} /> Add item</button>
        <button onClick={handleSave} disabled={saving} style={{ backgroundColor: "#8A6A2E", color: "#FFFFFF" }} className="text-xs px-3 py-1.5 rounded-none font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
          {saving ? "Saving…" : "Save " + title}
        </button>
        {saved && <span className="text-xs flex items-center gap-1" style={{ color: "#0E6B62" }}><CheckCircle2 size={13} /> Saved</span>}
      </div>
    </div>
  );
}

function SiteSettingsPanel({ siteSettings, updateSiteSettings, changeAdminPasscode, regenerateRecoveryCode }) {
  const [form, setForm] = useState({ email: siteSettings.email, phone: siteSettings.phone, terms: siteSettings.terms, privacy: siteSettings.privacy });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [passForm, setPassForm] = useState({ current: "", next: "", confirm: "" });
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState(false);
  const [passBusy, setPassBusy] = useState(false);

  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [issuedCode, setIssuedCode] = useState(null);
  const [recoveryError, setRecoveryError] = useState("");
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  async function handleSaveSettings() {
    setSaving(true);
    setSaved(false);
    await updateSiteSettings(form);
    setSaving(false);
    setSaved(true);
  }

  async function handleChangePasscode() {
    setPassError("");
    setPassSuccess(false);
    if (!passForm.current || !passForm.next) { setPassError("Fill in all fields."); return; }
    if (passForm.next.length < 4) { setPassError("New passcode must be at least 4 characters."); return; }
    if (passForm.next !== passForm.confirm) { setPassError("New passcodes don't match."); return; }
    setPassBusy(true);
    const res = await changeAdminPasscode(passForm.current, passForm.next);
    setPassBusy(false);
    if (res.ok) { setPassSuccess(true); setPassForm({ current: "", next: "", confirm: "" }); }
    else setPassError(res.error);
  }

  async function handleRegenerate() {
    setConfirmRegenerate(false);
    setRecoveryBusy(true);
    setRecoveryError("");
    const res = await regenerateRecoveryCode();
    setRecoveryBusy(false);
    if (res.ok) setIssuedCode(res.code);
    else setRecoveryError(res.error);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div>
        <div className="font-display font-semibold text-lg mb-1">Contact & Legal</div>
        <p className="text-xs text-[#10151F]/50 mb-4">Shown in the store footer. Edit anytime — changes are visible to customers immediately.</p>
        <div className="space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40 mb-1">Contact email</div>
            <Field icon={Mail} type="email" placeholder="Contact email" value={form.email} onChange={(v) => { setForm({ ...form, email: v }); setSaved(false); }} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40 mb-1">Contact phone</div>
            <Field icon={Phone} placeholder="Contact phone" value={form.phone} onChange={(v) => { setForm({ ...form, phone: v }); setSaved(false); }} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40 mb-1">Terms & Conditions</div>
            <textarea value={form.terms} onChange={(e) => { setForm({ ...form, terms: e.target.value }); setSaved(false); }} rows={6} style={{ color: "#10151F" }} className="w-full px-3 py-2.5 text-xs border border-[#D7DCE3] rounded-none focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40 font-mono" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40 mb-1">Privacy Policy</div>
            <textarea value={form.privacy} onChange={(e) => { setForm({ ...form, privacy: e.target.value }); setSaved(false); }} rows={6} style={{ color: "#10151F" }} className="w-full px-3 py-2.5 text-xs border border-[#D7DCE3] rounded-none focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40 font-mono" />
          </div>
          {saved && <div style={{ backgroundColor: "#D6E9E7", color: "#0E6B62" }} className="text-xs rounded-none p-2.5 flex items-center gap-1.5"><CheckCircle2 size={14} /> Saved.</div>}
          <button onClick={handleSaveSettings} disabled={saving} style={{ backgroundColor: "#8A6A2E", color: "#FFFFFF" }} className="px-4 py-2.5 rounded-none text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="border-t border-[#D7DCE3] pt-6">
        <div className="font-display font-semibold text-lg mb-1">Homepage content</div>
        <p className="text-xs text-[#10151F]/50 mb-4">Eyebrow badges, stats, and trust badges shown on the homepage — edit, add, or remove items below. Leave a section empty to show sensible defaults.</p>
        <div className="space-y-6">
          <HomepageListEditor
            title="Eyebrow badges" siteSettings={siteSettings} updateSiteSettings={updateSiteSettings} settingsKey="heroEyebrowBadges"
            fields={[{ key: "text", label: "Badge text", type: "text" }]}
            makeBlank={() => ({ text: "" })}
          />
          <HomepageListEditor
            title="Stats section" siteSettings={siteSettings} updateSiteSettings={updateSiteSettings} settingsKey="statsSection"
            fields={[{ key: "value", label: "Value (e.g. 15, 150+, ISO 13485)", type: "text" }, { key: "label", label: "Label", type: "text" }]}
            makeBlank={() => ({ value: "", label: "" })}
          />
          <HomepageListEditor
            title="Trust badges" siteSettings={siteSettings} updateSiteSettings={updateSiteSettings} settingsKey="trustBadges"
            fields={[{ key: "label", label: "Badge label", type: "text" }, { key: "icon", label: "Icon", type: "select", options: [["shield", "Shield / Certified"], ["certificate", "Certificate"], ["factory", "Factory"], ["material", "Material"]] }]}
            makeBlank={() => ({ label: "", icon: "shield" })}
          />
        </div>
      </div>

      <div className="border-t border-[#D7DCE3] pt-6">
        <div className="font-display font-semibold text-lg mb-1 flex items-center gap-1.5"><Lock size={16} /> Admin Passcode</div>
        <p className="text-xs text-[#10151F]/50 mb-4">Change the passcode used to enter this dashboard.</p>
        <div className="space-y-3 max-w-sm">
          {passSuccess && (
            <div style={{ backgroundColor: "#D6E9E7", color: "#0E6B62" }} className="text-xs rounded-none p-2.5 flex items-center gap-1.5"><CheckCircle2 size={14} /> Passcode updated successfully.</div>
          )}
          <Field icon={Lock} type="password" placeholder="Current password" value={passForm.current} onChange={(v) => setPassForm({ ...passForm, current: v })} />
          <Field icon={Lock} type="password" placeholder="New password" value={passForm.next} onChange={(v) => setPassForm({ ...passForm, next: v })} />
          <Field icon={Lock} type="password" placeholder="Confirm password" value={passForm.confirm} onChange={(v) => setPassForm({ ...passForm, confirm: v })} />
          {passError && <div className="text-xs text-red-500">{passError}</div>}
          <button onClick={handleChangePasscode} disabled={passBusy} style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="px-4 py-2.5 rounded-none text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
            {passBusy ? "Updating…" : "Update passcode"}
          </button>
        </div>
      </div>

      <div className="border-t border-[#D7DCE3] pt-6">
        <div className="font-display font-semibold text-lg mb-1 flex items-center gap-1.5"><HelpCircle size={16} /> Recovery Code</div>
        <p className="text-xs text-[#10151F]/50 mb-4">
          Used on the passcode screen if you ever forget it. Generating a new one immediately invalidates the old one — save it somewhere safe (password manager, notes app) as soon as it's shown; it won't be shown again.
        </p>
        <div className="max-w-sm space-y-3">
          {issuedCode && (
            <div className="space-y-2">
              <div style={{ backgroundColor: "#D6E9E7", color: "#0E6B62" }} className="text-xs rounded-none p-2.5 flex items-center gap-1.5"><CheckCircle2 size={14} /> New recovery code generated — save it now.</div>
              <div className="border-2 border-dashed border-[#D7DCE3] rounded-none p-4 text-center font-mono text-lg tracking-wider">{issuedCode}</div>
              <button onClick={() => navigator.clipboard?.writeText(issuedCode)} className="w-full py-2 border border-[#D7DCE3] rounded-none text-xs font-medium hover:bg-[#F4F5F8]">Copy code</button>
            </div>
          )}
          {recoveryError && <div className="text-xs text-red-500">{recoveryError}</div>}
          {confirmRegenerate ? (
            <div className="border border-[#D7DCE3] rounded-none p-3 space-y-2">
              <div className="text-xs">This replaces your current recovery code — the old one will stop working. Continue?</div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmRegenerate(false)} className="flex-1 py-2 border border-[#D7DCE3] rounded-none text-xs font-medium">Cancel</button>
                <button onClick={handleRegenerate} disabled={recoveryBusy} style={{ backgroundColor: "#1E3A5F", color: "#FFFFFF" }} className="flex-1 py-2 rounded-none text-xs font-semibold disabled:opacity-60">{recoveryBusy ? "Generating…" : "Yes, regenerate"}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setConfirmRegenerate(true); setIssuedCode(null); }} className="px-4 py-2.5 border border-[#D7DCE3] rounded-none text-sm font-medium hover:bg-[#F4F5F8] transition-colors">
              {issuedCode ? "Generate another code" : "Regenerate recovery code"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function HeroAdminPanel({ products, updateProduct, heroSelection, saveHeroSelection }) {
  const visible = products.filter((p) => !p.hidden);
  const [selected, setSelected] = useState(heroSelection && heroSelection.length ? heroSelection.filter((id) => visible.some((p) => p.id === id)) : []);
  const [saved, setSaved] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [imgError, setImgError] = useState("");

  function toggle(id) {
    setSaved(false);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function move(id, dir) {
    setSaved(false);
    setSelected((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  async function handleSave() {
    await saveHeroSelection(selected);
    setSaved(true);
  }
  async function handleImageChange(product, e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingId(product.id);
    setImgError("");
    try {
      const dataUrl = await compressImageFile(file);
      const ok = await updateProduct(product.id, { ...product, image: dataUrl });
      if (!ok) setImgError(`Couldn't save the photo for ${product.name}. Please try again.`);
    } catch (err) {
      setImgError(`Couldn't process that photo for ${product.name}. Try a different file.`);
    }
    setUploadingId(null);
    e.target.value = "";
  }
  async function removeImage(product) {
    await updateProduct(product.id, { ...product, image: null });
  }

  const usingAuto = selected.length === 0;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-start justify-between mb-1 gap-3">
        <div>
          <div className="font-display font-semibold text-lg">Hero banner</div>
          <p className="text-xs text-[#10151F]/50 mt-0.5">Pick which products rotate in the homepage banner, and give each one its own photo. Until a product has a photo, its technical diagram keeps rotating in its place.</p>
        </div>
        <button onClick={handleSave} style={{ backgroundColor: "#8A6A2E", color: "#FFFFFF" }} className="text-xs font-semibold px-3 py-2 rounded-none hover:opacity-90 transition-opacity shrink-0">
          {saved ? "Saved ✓" : "Save banner"}
        </button>
      </div>
      <div className="text-[11px] text-[#8A6A2E] font-mono mb-4">{usingAuto ? "Auto-picking (one per category)" : `${selected.length} product${selected.length === 1 ? "" : "s"} selected, in this order`}</div>
      {imgError && <div style={{ color: "#DC2626" }} className="text-xs mb-4">{imgError}</div>}

      {selected.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40 mb-2">Banner order</div>
          <div className="space-y-1.5">
            {selected.map((id, i) => {
              const p = visible.find((x) => x.id === id);
              if (!p) return null;
              return (
                <div key={id} className="flex items-center gap-2 bg-white border border-[#D7DCE3] rounded-none px-2 py-1.5">
                  <label style={{ display: "block", cursor: uploadingId === p.id ? "wait" : "pointer" }} className="w-10 h-8 shrink-0" title="Tap to change photo">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(p, e)} disabled={uploadingId === p.id} />
                    <ProductThumb product={p} />
                  </label>
                  <div className="text-xs flex-1 min-w-0 truncate">{p.name}</div>
                  <button onClick={() => move(id, -1)} disabled={i === 0} className="text-[#10151F]/50 disabled:opacity-20 px-1">▲</button>
                  <button onClick={() => move(id, 1)} disabled={i === selected.length - 1} className="text-[#10151F]/50 disabled:opacity-20 px-1">▼</button>
                  <button onClick={() => toggle(id)} className="text-red-500 px-1"><X size={14} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40 mb-2">All products</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <div key={p.id} style={isSelected ? { borderColor: "#8A6A2E" } : undefined} className="bg-white border border-[#D7DCE3] rounded-none overflow-hidden flex flex-col">
              <div className="relative">
                <label style={{ display: "block", cursor: uploadingId === p.id ? "wait" : "pointer" }}>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(p, e)} disabled={uploadingId === p.id} />
                  <ProductThumb product={p} />
                  <div style={{ position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(23,30,34,0.8)", color: "#FFFFFF", borderRadius: 4, padding: "5px 9px", display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600 }}>
                    <Upload size={12} /> {uploadingId === p.id ? "Uploading…" : p.image ? "Change photo" : "Add photo"}
                  </div>
                </label>
                <button
                  onClick={() => toggle(p.id)}
                  style={isSelected ? { backgroundColor: "#8A6A2E", color: "#FFFFFF" } : { backgroundColor: "rgba(255,255,255,0.9)", color: "#10151F" }}
                  className="absolute top-1.5 left-2 text-[10px] font-semibold px-2 py-1 rounded-none flex items-center gap-1"
                >
                  {isSelected && <Check size={11} strokeWidth={3} />} {isSelected ? "In banner" : "Add to banner"}
                </button>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                <div className="font-mono text-[10px] text-[#10151F]/50">{p.id}</div>
                <div className="font-display font-semibold text-sm leading-tight">{p.name}</div>
                <label style={{ backgroundColor: "#FFFFFF", border: "1px solid #D7DCE3", color: "#10151F", cursor: uploadingId === p.id ? "wait" : "pointer" }} className="text-xs font-medium px-2.5 py-1.5 rounded-none hover:bg-[#F4F5F8] transition-colors flex items-center justify-center gap-1.5">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(p, e)} disabled={uploadingId === p.id} />
                  <Upload size={12} /> {uploadingId === p.id ? "Uploading…" : p.image ? "Change photo" : "Add photo"}
                </label>
                {p.image ? (
                  <button onClick={() => removeImage(p)} style={{ color: "#DC2626" }} className="text-xs hover:underline self-start">Remove photo</button>
                ) : (
                  <div className="text-[10px] text-[#10151F]/40">No photo yet — diagram will rotate here.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function ProductFormModal({ product, onClose, onSave, busy, error, categories, addCategory }) {
  const [form, setForm] = useState(() => product
    ? { ...product }
    : { id: "", name: "", cat: categories[0] || "", material: "", dim: "", price: "", sterile: "Gamma Sterilized", moq: 1, image: null });
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [catError, setCatError] = useState("");

  const missing = [
    !form.name && "name",
    !form.cat && "category",
    !form.price && "price",
  ].filter(Boolean);
  const canSave = missing.length === 0;

  async function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageBusy(true);
    setImageError("");
    try {
      const dataUrl = await compressImageFile(file);
      setForm((f) => ({ ...f, image: dataUrl }));
    } catch (err) {
      setImageError("Could not process that image — try a different file.");
    }
    setImageBusy(false);
    e.target.value = "";
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div style={{ maxHeight: "92vh", overflowY: "auto" }} className="bg-white w-full sm:max-w-lg sm:rounded-none rounded-t-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#D7DCE3]">
          <div className="font-display font-semibold">{product ? "Edit product" : "Add product"}</div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40 mb-1.5">Photo</div>
            <label style={{ backgroundColor: "#F4F5F8", border: "2px dashed #D7DCE3" }} className="relative block w-40 h-32 mx-auto rounded-none cursor-pointer hover:border-[#8A6A2E] transition-colors overflow-hidden">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={imageBusy} />
              {form.image ? (
                <img src={form.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "rgba(23,30,34,0.4)" }}>
                  <Upload size={22} />
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>{imageBusy ? "Processing…" : "Tap to upload"}</span>
                </div>
              )}
              {imageBusy && form.image && (
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 500, color: "rgba(23,30,34,0.6)" }}>Processing…</div>
              )}
            </label>
            <div className="flex items-center justify-center gap-3 mt-2">
              <label style={{ backgroundColor: "#FFFFFF", border: "1px solid #D7DCE3", color: "#10151F", cursor: imageBusy ? "wait" : "pointer" }} className="text-xs font-medium px-3 py-1.5 rounded-none hover:bg-[#F4F5F8] transition-colors inline-flex items-center gap-1.5">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={imageBusy} />
                <Upload size={12} /> {form.image ? "Change photo" : "Upload photo"}
              </label>
              {form.image && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, image: null }))} className="text-xs text-red-500 hover:underline">Remove</button>
              )}
            </div>
            {imageError && <div className="text-xs text-red-500 mt-1 text-center">{imageError}</div>}
            {!form.image && <div className="text-[11px] text-[#10151F]/40 mt-1 text-center">No photo yet — the technical line-drawing icon will be shown instead.</div>}
          </div>

          <Field icon={ClipboardList} placeholder="Product code (leave blank to auto-generate)" value={form.id} onChange={(v) => setForm({ ...form, id: v })} disabled={!!product} />
          {product && <div className="text-[11px] text-[#10151F]/40 -mt-2">Product code can't be changed after creation.</div>}
          <Field icon={Package} placeholder="Product name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <SelectPills label="Category" options={categories} value={form.cat} onChange={(v) => setForm({ ...form, cat: v })} />
          {addingCat ? (
            <div className="flex gap-1.5 items-start">
              <div className="flex-1">
                <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name" aria-label="New category name" className="w-full px-2.5 py-2 text-xs border border-[#D7DCE3] rounded-none focus:outline-none focus:ring-2 focus:ring-[#8A6A2E]/40" />
                {catError && <div className="text-[11px] text-red-500 mt-1">{catError}</div>}
              </div>
              <button type="button" onClick={async () => { const res = await addCategory(newCat); if (res.ok) { setForm((f) => ({ ...f, cat: res.value })); setNewCat(""); setAddingCat(false); setCatError(""); } else setCatError(res.error); }} style={{ backgroundColor: "#8A6A2E", color: "#FFFFFF" }} className="text-xs font-medium px-2.5 py-2 rounded-none shrink-0">Add</button>
              <button type="button" onClick={() => { setAddingCat(false); setNewCat(""); setCatError(""); }} className="text-xs px-2.5 py-2 border border-[#D7DCE3] rounded-none shrink-0">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingCat(true)} className="text-xs text-[#8A6A2E] hover:underline flex items-center gap-1"><Tag size={12} /> Add new category</button>
          )}
          <Field icon={ClipboardList} placeholder="Material (e.g. Ti-6Al-4V Titanium Alloy)" value={form.material} onChange={(v) => setForm({ ...form, material: v })} />
          <Field icon={ClipboardList} placeholder="Dimensions (e.g. 6-hole · L98mm · W11mm)" value={form.dim} onChange={(v) => setForm({ ...form, dim: v })} />
          <div className="grid grid-cols-2 gap-2">
            <Field icon={CreditCard} type="number" placeholder="Price (PKR)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
            <Field icon={ListOrdered} type="number" placeholder="MOQ (units)" value={form.moq} onChange={(v) => setForm({ ...form, moq: v })} />
          </div>
          <SelectPills label="Sterilization" options={["Gamma Sterilized", "ETO Sterilized"]} value={form.sterile} onChange={(v) => setForm({ ...form, sterile: v })} />

          {error && <div className="text-xs text-red-500">{error}</div>}
          <button
            disabled={!canSave || busy || imageBusy}
            onClick={() => handleSaveClick()}
            style={canSave && !busy && !imageBusy ? { backgroundColor: "#1E3A5F", color: "#FFFFFF" } : undefined}
            className={`w-full py-2.5 rounded-none text-sm font-semibold transition-colors ${!canSave || busy || imageBusy ? "bg-[#F4F5F8] text-[#10151F]/40" : "hover:opacity-90"}`}
          >
            {busy ? "Saving…" : product ? "Save changes" : "Add product"}
          </button>
          {!canSave && <div className="text-[11px] text-[#10151F]/40 text-center">Fill in: {missing.join(", ")}</div>}
        </div>
      </div>
    </div>
  );

  function handleSaveClick() { onSave(form); }
}

function StatCard({ label, value, mono }) {
  return (
    <div className="bg-white border border-[#D7DCE3] rounded-none p-3">
      <div className="text-[10px] uppercase tracking-wide text-[#10151F]/40">{label}</div>
      <div className={`text-lg font-semibold mt-0.5 ${mono ? "font-mono" : "font-display"}`}>{value}</div>
    </div>
  );
}

function OrderCard({ order, updateStatus }) {
  const [open, setOpen] = useState(false);
  const Icon = STATUS_ICON[order.status];
  return (
    <div className="bg-white border border-[#D7DCE3] rounded-none overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3.5 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${STATUS_COLOR[order.status]}`}><Icon size={14} /></div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{order.customer.name} <span className="text-[#10151F]/40 font-normal">· {order.customer.type}</span></div>
            <div className="text-xs text-[#10151F]/50 font-mono">{order.orderId} · {new Date(order.ts).toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-sm font-semibold hidden sm:inline">{money(order.total)}</span>
          <ChevronRight size={16} className={`transition-transform ${open ? "rotate-90" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-[#D7DCE3] p-3.5 space-y-3 bg-[#F4F5F8]">
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[#10151F]/40 mb-1">Customer</div>
              <div>{order.customer.name}{order.customer.facility ? ` · ${order.customer.facility}` : ""}</div>
              <div className="font-mono">{order.customer.phone} · {order.customer.email}</div>
              <div>{order.customer.address}, {order.customer.city}</div>
              {order.customer.license && <div className="text-[#10151F]/50">License: {order.customer.license}</div>}
              {order.customer.notes && <div className="italic text-[#10151F]/50 mt-1">"{order.customer.notes}"</div>}
            </div>
            <div>
              <div className="text-[#10151F]/40 mb-1">Items</div>
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between font-mono"><span>{it.id} × {it.qty}</span><span>{money(it.price * it.qty)}</span></div>
              ))}
              <div className="flex justify-between font-mono font-semibold pt-1 mt-1 border-t border-[#D7DCE3]"><span>Total</span><span>{money(order.total)}</span></div>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#10151F]/40 mb-1.5">Update status</div>
            <div className="flex gap-1.5 flex-wrap items-center">
              {ALL_STATUSES.map((s) => {
                const selected = order.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateStatus(order.orderId, s)}
                    style={selected ? { backgroundColor: STATUS_HEX[s].bg, color: STATUS_HEX[s].text, borderColor: STATUS_HEX[s].text } : undefined}
                    className={`px-2.5 py-1.5 rounded-full text-[11px] border-2 flex items-center gap-1 transition-all ${selected ? "font-semibold shadow-sm" : "bg-white border-[#D7DCE3] text-[#10151F]/60"}`}
                  >
                    {selected && <Check size={10} strokeWidth={3} />}
                    {s}
                  </button>
                );
              })}
              <button onClick={() => printOrderInvoice(order)} className="ml-auto px-2.5 py-1.5 rounded-full text-[11px] border-2 border-[#D7DCE3] bg-white text-[#10151F]/60 flex items-center gap-1 hover:border-[#1E3A5F]/50" aria-label="Print invoice for this order">
                <Printer size={11} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
