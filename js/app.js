/* =========================================================
   Sticker Vault – SUPABASE Version (based on your working code)
   - Stickers NOT stored locally
   - Files -> Supabase Storage (Bucket: "Sticker-Vault")
   - Metadata -> Supabase Table   (Table:  "Sticker-Vault")
   - localStorage ONLY for theme + remember login
   - Cookie used for legal disclaimer consent
========================================================= */

/* ================= SUPABASE ================= */

const SUPABASE_URL = "https://xmvmvzzthqhbvybugzib.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtdm12enp0aHFoYnZ5YnVnemliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzU1NjksImV4cCI6MjA4NTYxMTU2OX0.pK5TT9uastEyMkRS4oWvpmj0iAFeKHod-98QeVVvZE0";

// IMPORTANT: don't declare `supabase` again (it exists globally from the CDN script)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// EXACT names as in Supabase
const BUCKET = "Sticker-Vault";
const TABLE = "Sticker-Vault";

/* ================= CONFIG ================= */

const ALLOWED_EXT = new Set(["png","tiff","tif","jpg","jpeg","webp","heic","svg","gif"]);
const CATEGORIES = ["Gina", "Conor", "Ole", "Leandra", "Lu", "Lea"];

const THEME_KEY = "stickerVault.theme.v2";

const SITE_PASSWORD_PLAIN = "mQ7!zV4#Kp2@Xn9$Hf6^tR8&cL1*Wj5%yD3=Sa0?Ue7+Bg4~Nv2_Zx9";
const AUTH_SESSION_KEY = "stickerVault.auth.session";
const AUTH_PERSIST_KEY = "stickerVault.auth.persist";

const LEGAL_COOKIE_NAME = "sv_legal_accepted";
const LEGAL_COOKIE_DAYS = 365;
/* NEW: background preferences */
const BG_PREF_KEY = "sv_bg_prefs.v1";

function svgDataUri(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const SVG_WEB = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 520 520">
  <rect width="520" height="520" fill="transparent"/>
  <g stroke="rgba(255,255,255,0.14)" stroke-width="1.4" fill="none">
    <!-- Full web centered -->
    <circle cx="260" cy="260" r="220"/>
    <circle cx="260" cy="260" r="180"/>
    <circle cx="260" cy="260" r="140"/>
    <circle cx="260" cy="260" r="100"/>
    <circle cx="260" cy="260" r="60"/>

    <!-- Radials -->
    <path d="M260 40 L260 480"/>
    <path d="M40 260 L480 260"/>
    <path d="M105 105 L415 415"/>
    <path d="M415 105 L105 415"/>
    <path d="M260 40 L415 105"/>
    <path d="M260 40 L105 105"/>
    <path d="M480 260 L415 105"/>
    <path d="M480 260 L415 415"/>
    <path d="M260 480 L415 415"/>
    <path d="M260 480 L105 415"/>
    <path d="M40 260 L105 415"/>
    <path d="M40 260 L105 105"/>
  </g>

  <!-- Full cat face (center-bottom) -->
  <g transform="translate(0,8)">
    <path d="M170 360 L210 300 L250 340 Z" fill="rgba(255,255,255,0.10)"/>
    <path d="M350 360 L310 300 L270 340 Z" fill="rgba(255,255,255,0.10)"/>
    <ellipse cx="260" cy="375" rx="110" ry="85" fill="rgba(255,255,255,0.10)"/>
    <circle cx="225" cy="372" r="10" fill="rgba(0,0,0,0.22)"/>
    <circle cx="295" cy="372" r="10" fill="rgba(0,0,0,0.22)"/>
    <path d="M260 392 L248 405 L272 405 Z" fill="rgba(0,0,0,0.22)"/>
    <path d="M248 410 Q260 420 272 410" stroke="rgba(0,0,0,0.22)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g stroke="rgba(0,0,0,0.20)" stroke-width="2" stroke-linecap="round">
      <path d="M190 395 L135 385"/>
      <path d="M190 405 L135 405"/>
      <path d="M190 415 L135 425"/>
      <path d="M330 395 L385 385"/>
      <path d="M330 405 L385 405"/>
      <path d="M330 415 L385 425"/>
    </g>
  </g>
</svg>
`);

const SVG_LEAVES = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 520 520">
  <rect width="520" height="520" fill="transparent"/>
  <!-- Leaves / plants -->
  <g fill="rgba(120,255,160,0.12)">
    <path d="M85 370c70-150 190-230 350-260-35 135-150 260-350 260z"/>
    <path d="M110 410c120-90 250-120 390-105-70 110-210 180-390 105z"/>
    <path d="M320 120c70 25 130 85 160 160-120 0-220-60-160-160z"/>
    <path d="M70 250c30-70 80-120 150-155-5 85-50 160-150 155z"/>
  </g>
  <g stroke="rgba(255,255,255,0.10)" stroke-width="2" fill="none" stroke-linecap="round">
    <path d="M110 410c110-140 220-235 360-300"/>
    <path d="M85 370c90-120 185-200 310-250"/>
    <path d="M320 120c12 72-6 128-55 185"/>
  </g>

  <!-- Full cat face (right-bottom) -->
  <g transform="translate(0,0)">
    <path d="M300 395 L330 335 L360 385 Z" fill="rgba(255,255,255,0.12)"/>
    <path d="M440 395 L410 335 L380 385 Z" fill="rgba(255,255,255,0.12)"/>
    <ellipse cx="370" cy="410" rx="95" ry="75" fill="rgba(255,255,255,0.12)"/>
    <circle cx="345" cy="408" r="9" fill="rgba(0,0,0,0.22)"/>
    <circle cx="395" cy="408" r="9" fill="rgba(0,0,0,0.22)"/>
    <path d="M370 426 L360 437 L380 437 Z" fill="rgba(0,0,0,0.22)"/>
    <path d="M360 442 Q370 450 380 442" stroke="rgba(0,0,0,0.22)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g stroke="rgba(0,0,0,0.20)" stroke-width="2" stroke-linecap="round">
      <path d="M315 428 L270 418"/>
      <path d="M315 438 L270 438"/>
      <path d="M315 448 L270 458"/>
      <path d="M425 428 L470 418"/>
      <path d="M425 438 L470 438"/>
      <path d="M425 448 L470 458"/>
    </g>
  </g>
</svg>
`);

const SVG_METAL = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 520 520">
  <rect width="520" height="520" fill="transparent"/>

  <!-- gritty scratches -->
  <g stroke="rgba(255,255,255,0.10)" stroke-width="2" stroke-linecap="round">
    <path d="M30 110 L250 40"/>
    <path d="M90 180 L420 80"/>
    <path d="M40 320 L420 220"/>
    <path d="M80 410 L500 310"/>
    <path d="M10 480 L260 420"/>
    <path d="M260 120 L500 60"/>
  </g>

  <!-- sharp metal symbol -->
  <g fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.14)" stroke-width="2">
    <path d="M260 85 L320 210 L470 235 L350 325 L380 470 L260 390 L140 470 L170 325 L50 235 L200 210 Z"/>
  </g>

  <!-- subtle grid / steel plate -->
  <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
    <path d="M0 52 L520 52"/><path d="M0 104 L520 104"/><path d="M0 156 L520 156"/>
    <path d="M0 208 L520 208"/><path d="M0 260 L520 260"/><path d="M0 312 L520 312"/>
    <path d="M0 364 L520 364"/><path d="M0 416 L520 416"/><path d="M0 468 L520 468"/>
    <path d="M52 0 L52 520"/><path d="M104 0 L104 520"/><path d="M156 0 L156 520"/>
    <path d="M208 0 L208 520"/><path d="M260 0 L260 520"/><path d="M312 0 L312 520"/>
    <path d="M364 0 L364 520"/><path d="M416 0 L416 520"/><path d="M468 0 L468 520"/>
  </g>
</svg>
`);

const SVG_ANIME = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 520 520">
  <rect width="520" height="520" fill="rgba(255,255,255,0.02)"/>

  <!-- "Anime collage" vibe: big bold panels + stylized faces (NOT official art, just a homage vibe) -->
  <g opacity="0.95">
    <rect x="20" y="20" width="230" height="150" rx="18" fill="rgba(255,120,80,0.18)"/>
    <rect x="270" y="20" width="230" height="150" rx="18" fill="rgba(124,92,255,0.18)"/>
    <rect x="20" y="190" width="150" height="200" rx="18" fill="rgba(55,210,177,0.16)"/>
    <rect x="190" y="190" width="310" height="120" rx="18" fill="rgba(255,80,160,0.16)"/>
    <rect x="190" y="330" width="310" height="170" rx="18" fill="rgba(255,255,255,0.08)"/>
  </g>

  <!-- stylized "shonen" icons -->
  <g fill="rgba(0,0,0,0.18)">
    <!-- spiky hair face (Naruto-ish vibe) -->
    <path d="M95 55 L110 75 L130 55 L145 75 L165 55 L160 92 Q130 125 100 92 Z"/>
    <circle cx="130" cy="112" r="34" fill="rgba(255,255,255,0.12)"/>
    <circle cx="120" cy="112" r="6"/><circle cx="140" cy="112" r="6"/>
    <path d="M120 128 Q130 136 140 128" stroke="rgba(0,0,0,0.22)" stroke-width="3" fill="none" stroke-linecap="round"/>

    <!-- sharp eyes face (JJK-ish vibe) -->
    <path d="M330 70 Q360 45 390 70 Q370 95 360 90 Q350 95 330 70 Z" fill="rgba(255,255,255,0.12)"/>
    <circle cx="360" cy="118" r="32" fill="rgba(255,255,255,0.12)"/>
    <path d="M345 112 Q360 102 375 112" stroke="rgba(0,0,0,0.22)" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M345 126 Q360 136 375 126" stroke="rgba(0,0,0,0.18)" stroke-width="3" fill="none" stroke-linecap="round"/>

    <!-- hero mask (MHA-ish vibe) -->
    <path d="M70 245 Q95 220 120 245 Q110 310 95 325 Q80 310 70 245 Z" fill="rgba(255,255,255,0.12)"/>
    <circle cx="95" cy="280" r="5"/><circle cx="112" cy="280" r="5"/>

    <!-- hunter vibe (HxH-ish) -->
    <path d="M265 215 L315 215 L300 240 L280 240 Z" fill="rgba(255,255,255,0.12)"/>
    <circle cx="290" cy="270" r="26" fill="rgba(255,255,255,0.12)"/>
    <circle cx="282" cy="268" r="5"/><circle cx="298" cy="268" r="5"/>
  </g>

  <!-- manga speed lines -->
  <g stroke="rgba(255,255,255,0.10)" stroke-width="2" stroke-linecap="round">
    <path d="M30 500 L130 420"/>
    <path d="M70 500 L190 410"/>
    <path d="M120 500 L250 400"/>
    <path d="M180 500 L330 390"/>
    <path d="M240 500 L420 380"/>
  </g>
</svg>
`);
const BG_PRESETS = {
  witch: {
    app: `radial-gradient(1200px 800px at 25% -10%, rgba(124,92,255,.22), transparent 55%),
          radial-gradient(900px 600px at 85% 15%, rgba(0,0,0,.58), transparent 55%),
          url("${SVG_WEB}"),
          #07080d`,
    panel: `linear-gradient(180deg, rgba(0,0,0,.38), rgba(0,0,0,.18)),
            url("${SVG_WEB}")`,
    topbar: `linear-gradient(180deg, rgba(0,0,0,.36), rgba(0,0,0,.16)),
             url("${SVG_WEB}")`
  },

  cozy: {
    app: `radial-gradient(1100px 750px at 25% -10%, rgba(30,140,95,.22), transparent 55%),
          radial-gradient(900px 600px at 85% 10%, rgba(0,0,0,.44), transparent 55%),
          url("${SVG_LEAVES}"),
          #06110c`,
    panel: `linear-gradient(180deg, rgba(10,30,20,.34), rgba(0,0,0,.12)),
            url("${SVG_LEAVES}")`,
    topbar: `linear-gradient(180deg, rgba(10,30,20,.32), rgba(0,0,0,.10)),
             url("${SVG_LEAVES}")`
  },

  metal: {
    app: `radial-gradient(1100px 700px at 20% -10%, rgba(255,255,255,.10), transparent 55%),
          radial-gradient(900px 600px at 80% 10%, rgba(0,0,0,.62), transparent 55%),
          url("${SVG_METAL}"),
          #05060a`,
    panel: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.26)),
            url("${SVG_METAL}")`,
    topbar: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.22)),
             url("${SVG_METAL}")`
  },

  anime: {
    app: `radial-gradient(1100px 700px at 20% -10%, rgba(255,80,160,.18), transparent 55%),
          radial-gradient(900px 600px at 80% 10%, rgba(124,92,255,.18), transparent 55%),
          url("${SVG_ANIME}"),
          #070a12`,
    panel: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.16)),
            url("${SVG_ANIME}")`,
    topbar: `linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.14)),
             url("${SVG_ANIME}")`
  }
};

function applyBackgroundPrefs(prefs) {
  const root = document.documentElement;
  const appKey = prefs?.app || "witch";
  const panelKey = prefs?.panel || "witch";
  const topbarKey = prefs?.topbar || "witch";

  const app = BG_PRESETS[appKey]?.app || BG_PRESETS.witch.app;
  const panel = BG_PRESETS[panelKey]?.panel || BG_PRESETS.witch.panel;
  const topbar = BG_PRESETS[topbarKey]?.topbar || BG_PRESETS.witch.topbar;

  root.style.setProperty("--app-bg", app);
  root.style.setProperty("--panel-bg", panel);
  root.style.setProperty("--topbar-bg", topbar);
}

function loadBackgroundPrefs() {
  try {
    const raw = localStorage.getItem(BG_PREF_KEY);
    if (!raw) return { app: "witch", panel: "witch", topbar: "witch" };
    const parsed = JSON.parse(raw);
    return {
      app: parsed.app || "witch",
      panel: parsed.panel || "witch",
      topbar: parsed.topbar || "witch"
    };
  } catch {
    return { app: "witch", panel: "witch", topbar: "witch" };
  }
}

function saveBackgroundPrefs(prefs) {
  localStorage.setItem(BG_PREF_KEY, JSON.stringify(prefs));
}

/* ================= STATE ================= */

let activeCategory = "none";  // must pick category for upload
let isAuthed = false;
let isLegalAccepted = false;

/* ================= INIT (after DOM ready) ================= */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
     const bgPrefs = loadBackgroundPrefs();
  applyBackgroundPrefs(bgPrefs);
     const bgBtn = document.getElementById("bgBtn");
  const bgOverlay = document.getElementById("bgOverlay");
  const bgCloseBtn = document.getElementById("bgCloseBtn");
  const bgResetBtn = document.getElementById("bgResetBtn");
  const bgAppSelect = document.getElementById("bgAppSelect");
  const bgPanelSelect = document.getElementById("bgPanelSelect");
  const bgTopbarSelect = document.getElementById("bgTopbarSelect");

  const appRoot = document.getElementById("appRoot");

  const authOverlay = document.getElementById("authOverlay");
  const authForm = document.getElementById("authForm");
  const authPassword = document.getElementById("authPassword");
  const authRemember = document.getElementById("authRemember");
  const authMsg = document.getElementById("authMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  const legalOverlay = document.getElementById("legalOverlay");
  const legalAcceptCheck = document.getElementById("legalAcceptCheck");
  const legalAcceptBtn = document.getElementById("legalAcceptBtn");
  const legalDeclineBtn = document.getElementById("legalDeclineBtn");
  const legalMsg = document.getElementById("legalMsg");

  const themeToggle = document.getElementById("themeToggle");

  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const closeSidebar = document.getElementById("closeSidebar");
  const sidebarSearch = document.getElementById("sidebarSearch");

  const uploadControls = document.getElementById("uploadControls");
  const uploadLockedHint = document.getElementById("uploadLockedHint");
  const activeCategoryLabel = document.getElementById("activeCategoryLabel");

  const fileInput = document.getElementById("fileInput");
  const clearAllBtn = document.getElementById("clearAll");
  const grid = document.getElementById("grid");
  const statusEl = document.getElementById("status");
  const countEl = document.getElementById("count");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  /* ---------- UI helpers ---------- */

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function lockUI() {
    if (!appRoot) return;
    appRoot.style.pointerEvents = "none";
    appRoot.style.userSelect = "none";
    appRoot.style.filter = "blur(6px)";
  }

  function unlockUI() {
    if (!appRoot) return;
    appRoot.style.pointerEvents = "";
    appRoot.style.userSelect = "";
    appRoot.style.filter = "";
  }

  function updateUploadVisibility() {
    const ok = CATEGORIES.includes(activeCategory);
    if (uploadControls) uploadControls.hidden = !ok;
    if (uploadLockedHint) uploadLockedHint.hidden = ok;
    if (activeCategoryLabel) activeCategoryLabel.textContent = ok ? activeCategory : "—";
  }
  function openBgSettings() {
    const prefs = loadBackgroundPrefs();
    bgAppSelect.value = prefs.app || "witch";
    bgPanelSelect.value = prefs.panel || "witch";
    bgTopbarSelect.value = prefs.topbar || "witch";

    bgOverlay.classList.add("show");
    bgOverlay.setAttribute("aria-hidden", "false");
  }

  function closeBgSettings() {
    bgOverlay.classList.remove("show");
    bgOverlay.setAttribute("aria-hidden", "true");
  }

  function commitBgPrefs() {
    const prefs = {
      app: bgAppSelect.value,
      panel: bgPanelSelect.value,
      topbar: bgTopbarSelect.value
    };
    saveBackgroundPrefs(prefs);
    applyBackgroundPrefs(prefs);
  }

  bgBtn?.addEventListener("click", () => openBgSettings());
  bgCloseBtn?.addEventListener("click", () => closeBgSettings());

  bgOverlay?.addEventListener("click", (e) => {
    if (e.target === bgOverlay) closeBgSettings();
  });

  bgAppSelect?.addEventListener("change", () => commitBgPrefs());
  bgPanelSelect?.addEventListener("change", () => commitBgPrefs());
  bgTopbarSelect?.addEventListener("change", () => commitBgPrefs());

  bgResetBtn?.addEventListener("click", () => {
    const prefs = { app: "witch", panel: "witch", topbar: "witch" };
    saveBackgroundPrefs(prefs);
    applyBackgroundPrefs(prefs);
    bgAppSelect.value = "witch";
    bgPanelSelect.value = "witch";
    bgTopbarSelect.value = "witch";
    setStatus("🖼️ Background zurückgesetzt.");
  });

  /* ---------- THEME ---------- */

  (function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  })();

  themeToggle?.addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  });

  /* ---------- AUTH + LEGAL ---------- */

  function refreshAccess() {
    // reset
    authOverlay?.classList.remove("show");
    legalOverlay?.classList.remove("show");
    unlockUI();

    if (!isAuthed) {
      authOverlay?.classList.add("show");
      lockUI();
      return;
    }
    if (!isLegalAccepted) {
      legalOverlay?.classList.add("show");
      lockUI();
      return;
    }
    unlockUI();
  }

  (function initAuthState() {
    const hasSession = sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
    const hasPersist = localStorage.getItem(AUTH_PERSIST_KEY) === "1";
    isAuthed = hasSession || hasPersist;

    isLegalAccepted = getCookie(LEGAL_COOKIE_NAME) === "1";
    refreshAccess();
  })();

  authForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    authMsg.textContent = "";

    if (authPassword.value === SITE_PASSWORD_PLAIN) {
      if (authRemember?.checked) localStorage.setItem(AUTH_PERSIST_KEY, "1");
      else sessionStorage.setItem(AUTH_SESSION_KEY, "1");

      authPassword.value = "";
      isAuthed = true;
      setStatus("🔓 Entsperrt.");
      refreshAccess();
    } else {
      authMsg.textContent = "❌ Falsches Passwort.";
      authPassword.select();
    }
  });

  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_PERSIST_KEY);
    isAuthed = false;
    refreshAccess();
    setStatus("🔒 Abgemeldet.");
  });

  // Legal accept logic (same as your working code)
  if (legalAcceptBtn && legalAcceptCheck) {
    legalAcceptBtn.disabled = true;

    legalAcceptCheck.addEventListener("change", () => {
      legalAcceptBtn.disabled = !legalAcceptCheck.checked;
      if (legalMsg) legalMsg.textContent = "";
    });

    legalAcceptBtn.addEventListener("click", () => {
      if (!legalAcceptCheck.checked) {
        if (legalMsg) legalMsg.textContent = "Bitte Checkbox aktivieren, um zu akzeptieren.";
        return;
      }
      setCookie(LEGAL_COOKIE_NAME, "1", LEGAL_COOKIE_DAYS);
      isLegalAccepted = true;
      setStatus("✅ Hinweis akzeptiert.");
      refreshAccess();
    });
  }

  legalDeclineBtn?.addEventListener("click", () => {
    if (legalMsg) legalMsg.textContent = "Ohne Zustimmung kannst du diese Seite nicht nutzen.";
    setTimeout(() => (window.location.href = "about:blank"), 600);
  });

  /* ---------- SIDEBAR ---------- */

  function openSidebar() {
    if (!sidebar || !sidebarBackdrop) return;
    sidebar.classList.add("open");
    sidebarBackdrop.hidden = false;
    sidebar.setAttribute("aria-hidden", "false");
    menuBtn?.setAttribute("aria-expanded", "true");
    if (sidebarSearch) setTimeout(() => sidebarSearch.focus(), 0);
  }

  function closeSidebarFn() {
    if (!sidebar || !sidebarBackdrop) return;
    sidebar.classList.remove("open");
    sidebarBackdrop.hidden = true;
    sidebar.setAttribute("aria-hidden", "true");
    menuBtn?.setAttribute("aria-expanded", "false");
  }

  menuBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openSidebar();
  });

  closeSidebar?.addEventListener("click", (e) => {
    e.preventDefault();
    closeSidebarFn();
  });

  sidebarBackdrop?.addEventListener("click", () => closeSidebarFn());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebarFn();
  });

  // Search sync
  sidebarSearch?.addEventListener("input", () => {
    if (searchInput) searchInput.value = sidebarSearch.value;
    render();
  });

  searchInput?.addEventListener("input", () => {
    if (sidebarSearch && sidebarSearch.value !== searchInput.value) {
      sidebarSearch.value = searchInput.value;
    }
    render();
  });

  // Category buttons
  document.querySelectorAll(".catBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const chosen = btn.dataset.category || "all";

      document.querySelectorAll(".catBtn").forEach(b => {
        b.classList.toggle("active", (b.dataset.category || "all") === chosen);
      });

      activeCategory = (chosen === "all") ? "none" : chosen;
      updateUploadVisibility();
      render();
      closeSidebarFn();
    });
  });

  /* ---------- SUPABASE HELPERS ---------- */

  function getPublicUrl(path) {
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl || "";
  }

  async function fetchCategoryItems(category) {
    const { data, error } = await sb
      .from(TABLE)
      .select("id, filename, path, category, created_at")
      .eq("category", category);

    if (error) throw error;
    return data || [];
  }

  /* ---------- UPLOAD (SUPABASE) ---------- */

  fileInput?.addEventListener("change", async (e) => {
    try {
      if (!CATEGORIES.includes(activeCategory)) {
        setStatus("❌ Bitte zuerst eine Kategorie auswählen.");
        fileInput.value = "";
        return;
      }

      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      let added = 0;

      for (const file of files) {
        const ext = getExt(file.name);
        if (!ALLOWED_EXT.has(ext)) continue;

        const id = crypto.randomUUID();
        const safeName = sanitizeFilename(file.name);
        const path = `${activeCategory}/${id}_${safeName}`;

        // Upload file to storage
        const { error: upErr } = await sb.storage
          .from(BUCKET)
          .upload(path, file, {
            upsert: false,
            cacheControl: "3600",
            contentType: file.type || undefined
          });

        if (upErr) {
          console.error(upErr);
          setStatus(`❌ Upload fehlgeschlagen: "${file.name}"`);
          continue;
        }

        // Insert DB row
        const { error: insErr } = await sb
          .from(TABLE)
          .insert([{
            id,
            filename: file.name,
            path,
            category: activeCategory
          }]);

        if (insErr) {
          console.error(insErr);
          setStatus(`⚠️ Datei hochgeladen, aber DB-Eintrag fehlgeschlagen: "${file.name}"`);
          // Optional rollback:
          // await sb.storage.from(BUCKET).remove([path]);
          continue;
        }

        added++;
      }

      fileInput.value = "";
      if (added) setStatus(`✅ ${added} Sticker in "${activeCategory}" hochgeladen.`);
      render();
    } catch (err) {
      console.error(err);
      setStatus("❌ Upload-Fehler (Policy/RLS?). Siehe Console.");
    }
  });

  /* ---------- CLEAR CATEGORY (SUPABASE) ---------- */

  clearAllBtn?.addEventListener("click", async () => {
    try {
      if (!CATEGORIES.includes(activeCategory)) {
        setStatus("❌ Bitte zuerst eine Kategorie auswählen.");
        return;
      }
      const ok = confirm(`Wirklich alle Sticker in "${activeCategory}" löschen?`);
      if (!ok) return;

      const { data, error } = await sb
        .from(TABLE)
        .select("id, path")
        .eq("category", activeCategory);

      if (error) throw error;

      const rows = data || [];
      const paths = rows.map(r => r.path).filter(Boolean);

      if (paths.length) {
        const { error: rmErr } = await sb.storage.from(BUCKET).remove(paths);
        if (rmErr) throw rmErr;
      }

      const { error: delErr } = await sb.from(TABLE).delete().eq("category", activeCategory);
      if (delErr) throw delErr;

      setStatus(`🗑️ "${activeCategory}" geleert.`);
      render();
    } catch (err) {
      console.error(err);
      setStatus("❌ Löschen fehlgeschlagen (Policy/RLS?). Siehe Console.");
    }
  });

  sortSelect?.addEventListener("change", () => render());

  /* ---------- RENDER (SUPABASE) ---------- */

  async function render() {
    if (!grid || !countEl) return;

    // require category to show (so "Alle" means: nothing until category chosen)
    if (!CATEGORIES.includes(activeCategory)) {
      countEl.textContent = "0";
      grid.innerHTML = `
        <div class="status" style="grid-column: 1 / -1;">
          Wähle links im Menü eine Kategorie, um Sticker zu sehen oder hochzuladen.
        </div>`;
      return;
    }

    try {
      const s = (searchInput?.value || "").trim().toLowerCase();

      let view = await fetchCategoryItems(activeCategory);

      // search filter
      if (s) {
        view = view.filter(it => String(it.filename || "").toLowerCase().includes(s));
      }

      // sort (same options as before)
      const sortMode = sortSelect?.value || "newest";
      if (sortMode === "newest") view.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      if (sortMode === "oldest") view.sort((a,b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      if (sortMode === "az") view.sort((a,b) => String(a.filename||"").localeCompare(String(b.filename||"")));
      if (sortMode === "za") view.sort((a,b) => String(b.filename||"").localeCompare(String(a.filename||"")));

      countEl.textContent = String(view.length);
      grid.innerHTML = "";

      if (!view.length) {
        grid.innerHTML = `
          <div class="status" style="grid-column: 1 / -1;">
            In <strong>${escapeHtml(activeCategory)}</strong> sind noch keine Sticker.
          </div>`;
        return;
      }

      for (const it of view) {
        const card = document.createElement("div");
        card.className = "card";

        const safeName = escapeHtml(it.filename || "sticker");
        const url = getPublicUrl(it.path);

        card.innerHTML = `
          <div class="preview">
            ${url ? `<img src="${url}" alt="${safeName}" loading="lazy" />` : ""}
          </div>
          <div class="meta">
            <div class="nameRow">
              <div class="filename" title="${safeName}">${safeName}</div>
              <div class="badge category">${escapeHtml(it.category || "")}</div>
            </div>
            <div class="cardActions">
              <button class="btn secondary" data-action="download">⬇️ Download</button>
              <button class="btn danger" data-action="delete">🗑️</button>
            </div>
          </div>
        `;

        card.addEventListener("click", async (ev) => {
          const btn = ev.target.closest("button");
          if (!btn) return;

          const action = btn.dataset.action;

          if (action === "download") {
            if (!url) {
              setStatus("❌ Keine URL verfügbar.");
              return;
            }
            triggerDownload(url, it.filename || "sticker");
            setStatus(`⬇️ Download gestartet: "${it.filename}"`);
          }

          if (action === "delete") {
            const ok = confirm(`Sticker löschen?\n${it.filename}`);
            if (!ok) return;

            try {
              if (it.path) {
                const { error: rmErr } = await sb.storage.from(BUCKET).remove([it.path]);
                if (rmErr) throw rmErr;
              }
              const { error: delErr } = await sb.from(TABLE).delete().eq("id", it.id);
              if (delErr) throw delErr;

              setStatus("🗑️ Sticker gelöscht.");
              render();
            } catch (err) {
              console.error(err);
              setStatus("❌ Löschen fehlgeschlagen (Policy/RLS?). Siehe Console.");
            }
          }
        });

        grid.appendChild(card);
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Laden fehlgeschlagen (Policy/RLS?). Siehe Console.");
      grid.innerHTML = `
        <div class="status" style="grid-column: 1 / -1;">
          Fehler beim Laden. Öffne F12 → Console und sende mir die Fehlermeldung.
        </div>`;
    }
  }

  // boot
  updateUploadVisibility();
  render();
});

/* ================= HELPERS ================= */

function getExt(filename) {
  const m = (filename || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function sanitizeFilename(name) {
  return String(name)
    .replaceAll("\\", "_")
    .replaceAll("/", "_")
    .replaceAll("..", "_")
    .replace(/[^\w.\-() ]+/g, "_")
    .trim();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;" }[m])
  );
}

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "sticker";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* Cookies */
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const target = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";").map((x) => x.trim());
  for (const p of parts) {
    if (p.startsWith(target)) return decodeURIComponent(p.substring(target.length));
  }
  return "";
}
