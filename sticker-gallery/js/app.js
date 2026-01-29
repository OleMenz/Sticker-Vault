/* Sticker Vault – local-only storage + client-side auth gate + legal cookie consent */

const ALLOWED_EXT = new Set([
  "png","tiff","tif","jpg","jpeg","webp","heic","svg","gif"
]);

const CATEGORIES = ["Gina", "Conor", "Ole"];

const STORAGE_KEY = "stickerVault.items.v3";
const THEME_KEY = "stickerVault.theme.v2";

/* ---------- AUTH CONFIG ----------
   ÄNDERE DAS PASSWORT HIER:
*/
const SITE_PASSWORD_PLAIN = "mQ7!zV4#Kp2@Xn9$Hf6^tR8&cL1*Wj5%yD3=Sa0?Ue7+Bg4~Nv2_Zx9";

const AUTH_SESSION_KEY = "stickerVault.auth.session";
const AUTH_PERSIST_KEY = "stickerVault.auth.persist";

/* ---------- LEGAL / COOKIE CONSENT CONFIG ---------- */
const LEGAL_COOKIE_NAME = "sv_legal_accepted";
const LEGAL_COOKIE_DAYS = 365;

/* ---------- Elements ---------- */
const appRoot = document.getElementById("appRoot");

const authOverlay = document.getElementById("authOverlay");
const authForm = document.getElementById("authForm");
const authPassword = document.getElementById("authPassword");
const authRemember = document.getElementById("authRemember");
const authMsg = document.getElementById("authMsg");

const legalOverlay = document.getElementById("legalOverlay");
const legalAcceptCheck = document.getElementById("legalAcceptCheck");
const legalAcceptBtn = document.getElementById("legalAcceptBtn");
const legalDeclineBtn = document.getElementById("legalDeclineBtn");
const legalMsg = document.getElementById("legalMsg");

const themeToggle = document.getElementById("themeToggle");
const logoutBtn = document.getElementById("logoutBtn");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const closeSidebar = document.getElementById("closeSidebar");
const sidebarSearch = document.getElementById("sidebarSearch");

const uploadControls = document.getElementById("uploadControls");
const uploadLockedHint = document.getElementById("uploadLockedHint");
const activeCategoryLabel = document.getElementById("activeCategoryLabel");

const fileInput = document.getElementById("fileInput");
const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const clearAllBtn = document.getElementById("clearAll");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

/* ---------- State ---------- */
let items = loadItems();
let activeCategory = "none";  // "none" = noch keine Kategorie ausgewählt
let sidebarSelected = "all";  // UI-Selection für Buttons (Alle/Gina/Conor/Ole)

let isAuthed = false;
let isLegalAccepted = false;

/* ================= AUTH ================= */
initAuthGate();

/* ================= THEME ================= */
initTheme();

/* ================= LEGAL CONSENT ================= */
initLegalConsent();

/* ================= Upload visibility ================= */
updateUploadVisibility();

/* ================= SIDEBAR ================= */
initSidebar();

/* ================= STICKERS ================= */
initStickers();

/* ---------------------------- */
/* UI Gate: everything depends on auth + legal */
/* ---------------------------- */
function refreshAccessGates() {
  // Legal acceptance only matters after auth (because otherwise user can't use site anyway).
  // But we still enforce both before enabling app interactions.
  if (!isAuthed) {
    showAuth();
    hideLegal();
    setAppInteractive(false);
    return;
  }

  // authed -> check legal
  if (!isLegalAccepted) {
    hideAuth();
    showLegal();
    setAppInteractive(false);
    return;
  }

  // authed + legal accepted
  hideAuth();
  hideLegal();
  setAppInteractive(true);
}

/* ---------- Auth ---------- */
function initAuthGate() {
  // start locked
  setAppInteractive(false);

  const hasSession = sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
  const hasPersist = localStorage.getItem(AUTH_PERSIST_KEY) === "1";
  isAuthed = (hasSession || hasPersist);

  refreshAccessGates();

  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    authMsg.textContent = "";

    const input = authPassword.value;
    if (!input) return;

    if (timingSafeEqual(input, SITE_PASSWORD_PLAIN)) {
      if (authRemember.checked) {
        localStorage.setItem(AUTH_PERSIST_KEY, "1");
      } else {
        sessionStorage.setItem(AUTH_SESSION_KEY, "1");
      }
      authPassword.value = "";
      isAuthed = true;
      setStatus("🔓 Entsperrt.");
      refreshAccessGates();
    } else {
      authMsg.textContent = "❌ Falsches Passwort.";
      authPassword.select();
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_PERSIST_KEY);
    isAuthed = false;
    setStatus("🔒 Abgemeldet.");
    refreshAccessGates();
  });
}

function showAuth() {
  authOverlay.classList.add("show");
  authOverlay.setAttribute("aria-hidden", "false");
  setTimeout(() => authPassword.focus(), 0);
}
function hideAuth() {
  authOverlay.classList.remove("show");
  authOverlay.setAttribute("aria-hidden", "true");
}

/* ---------- Legal Consent (Cookie) ---------- */
function initLegalConsent() {
  isLegalAccepted = getCookie(LEGAL_COOKIE_NAME) === "1";

  // Button enabled only if checkbox checked
  if (legalAcceptCheck && legalAcceptBtn) {
    legalAcceptBtn.disabled = !legalAcceptCheck.checked;

    legalAcceptCheck.addEventListener("change", () => {
      legalAcceptBtn.disabled = !legalAcceptCheck.checked;
      if (legalMsg) legalMsg.textContent = "";
    });
  }

  if (legalAcceptBtn) {
    legalAcceptBtn.addEventListener("click", () => {
      if (!legalAcceptCheck.checked) {
        if (legalMsg) legalMsg.textContent = "Bitte Checkbox aktivieren, um zu akzeptieren.";
        return;
      }
      setCookie(LEGAL_COOKIE_NAME, "1", LEGAL_COOKIE_DAYS);
      isLegalAccepted = true;
      setStatus("✅ Hinweis akzeptiert.");
      refreshAccessGates();
    });
  }

  if (legalDeclineBtn) {
    legalDeclineBtn.addEventListener("click", () => {
      // stay locked; offer to leave
      if (legalMsg) legalMsg.textContent = "Ohne Zustimmung kannst du diese Seite nicht nutzen.";
      // optional: try to close tab (often blocked by browsers)
      // window.close();
      // fallback: navigate away
      setTimeout(() => {
        window.location.href = "about:blank";
      }, 600);
    });
  }

  refreshAccessGates();
}

function showLegal() {
  legalOverlay.classList.add("show");
  legalOverlay.setAttribute("aria-hidden", "false");
  if (legalMsg) legalMsg.textContent = "";
  if (legalAcceptCheck) legalAcceptCheck.checked = false;
  if (legalAcceptBtn) legalAcceptBtn.disabled = true;
}
function hideLegal() {
  legalOverlay.classList.remove("show");
  legalOverlay.setAttribute("aria-hidden", "true");
}

/* ---------- Theme ---------- */
themeToggle.addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  setStatus(next === "light" ? "☀️ Light Mode aktiv." : "🌙 Dark Mode aktiv.");
});

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;

  const initial =
    saved === "light" ? "light" :
    saved === "dark" ? "dark" :
    (prefersLight ? "light" : "dark");

  document.documentElement.setAttribute("data-theme", initial);
}

/* ---------- Sidebar ---------- */
function initSidebar() {
  if (!(menuBtn && sidebar && sidebarBackdrop && closeSidebar)) return;

  menuBtn.addEventListener("click", openSidebar);
  closeSidebar.addEventListener("click", closeSidebarFn);
  sidebarBackdrop.addEventListener("click", closeSidebarFn);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebarFn();
  });

  // Sidebar search -> main search
  if (sidebarSearch) {
    sidebarSearch.addEventListener("input", () => {
      searchInput.value = sidebarSearch.value;
      render();
    });
  }

  // keep both search inputs in sync
  searchInput.addEventListener("input", () => {
    if (sidebarSearch && sidebarSearch.value !== searchInput.value) {
      sidebarSearch.value = searchInput.value;
    }
    render();
  });

  // Category buttons
  document.querySelectorAll(".catBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const chosen = btn.dataset.category || "all";
      sidebarSelected = chosen;
      setActiveCategoryButton(sidebarSelected);

      // Upload nur wenn echte Kategorie (nicht "all")
      if (chosen === "all") activeCategory = "none";
      else activeCategory = chosen;

      updateUploadVisibility();
      render();
      closeSidebarFn();
    });
  });

  setActiveCategoryButton(sidebarSelected);
}

function openSidebar() {
  sidebar.classList.add("open");
  sidebar.setAttribute("aria-hidden", "false");
  menuBtn.setAttribute("aria-expanded", "true");
  sidebarBackdrop.hidden = false;
  if (sidebarSearch) setTimeout(() => sidebarSearch.focus(), 0);
}

function closeSidebarFn() {
  sidebar.classList.remove("open");
  sidebar.setAttribute("aria-hidden", "true");
  menuBtn.setAttribute("aria-expanded", "false");
  sidebarBackdrop.hidden = true;
}

function setActiveCategoryButton(cat) {
  document.querySelectorAll(".catBtn").forEach(b => {
    b.classList.toggle("active", (b.dataset.category || "all") === cat);
  });
}

/* ---------- Upload visibility ---------- */
function updateUploadVisibility() {
  const isValid = CATEGORIES.includes(activeCategory);

  if (isValid) {
    uploadControls.hidden = false;
    uploadLockedHint.hidden = true;
    activeCategoryLabel.textContent = activeCategory;
  } else {
    uploadControls.hidden = true;
    uploadLockedHint.hidden = false;
    activeCategoryLabel.textContent = "—";
  }
}

/* ---------- Stickers ---------- */
function initStickers() {
  fileInput.addEventListener("change", async (e) => {
    if (!CATEGORIES.includes(activeCategory)) {
      setStatus("❌ Bitte zuerst eine Kategorie im Menü auswählen (Gina/Conor/Ole).");
      fileInput.value = "";
      return;
    }

    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    let added = 0;
    for (const file of files) {
      const ext = getExt(file.name);
      if (!ALLOWED_EXT.has(ext)) {
        setStatus(`❌ "${file.name}" übersprungen (nicht erlaubt).`);
        continue;
      }

      try {
        const dataUrl = await readAsDataURL(file);
        const item = {
          id: crypto.randomUUID(),
          name: file.name,
          ext,
          size: file.size,
          type: file.type || mimeFromExt(ext),
          category: activeCategory,
          addedAt: Date.now(),
          dataUrl
        };

        items.push(item);
        added++;
      } catch (err) {
        console.error(err);
        setStatus(`❌ Fehler beim Lesen von "${file.name}".`);
      }
    }

    saveItems(items);
    render();

    if (added > 0) setStatus(`✅ ${added} Sticker in "${activeCategory}" hinzugefügt.`);
    fileInput.value = "";
  });

  clearAllBtn.addEventListener("click", () => {
    if (!items.length) {
      setStatus("Nichts zu löschen.");
      return;
    }

    const ok = confirm("Wirklich alle Sticker löschen? (lokal im Browser)");
    if (!ok) return;

    items = [];
    saveItems(items);
    render();
    setStatus("🗑️ Alle Sticker gelöscht.");
  });

  sortSelect.addEventListener("change", render);

  render();
}

/* ---------- Render ---------- */
function render() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const sortMode = sortSelect.value;

  let view = [...items];

  // Suche
  if (q) view = view.filter(it => (it.name || "").toLowerCase().includes(q));

  // Kategorie-Filter nur wenn gültige Kategorie aktiv
  if (CATEGORIES.includes(activeCategory)) {
    view = view.filter(it => it.category === activeCategory);
  }

  // Sort
  view.sort((a, b) => {
    if (sortMode === "newest") return b.addedAt - a.addedAt;
    if (sortMode === "oldest") return a.addedAt - b.addedAt;
    if (sortMode === "az") return (a.name || "").localeCompare(b.name || "");
    if (sortMode === "za") return (b.name || "").localeCompare(a.name || "");
    return 0;
  });

  countEl.textContent = String(view.length);

  // Empty State
  if (view.length === 0) {
    grid.innerHTML = `
      <div class="status" style="grid-column: 1 / -1;">
        ${
          CATEGORIES.includes(activeCategory)
            ? `In <strong>${escapeHtml(activeCategory)}</strong> sind noch keine Sticker. Lade welche hoch! 🙂`
            : "Wähle links im Menü eine Kategorie, um Sticker zu sehen oder hochzuladen."
        }
      </div>
    `;
    return;
  }

  grid.innerHTML = "";
  for (const it of view) {
    const card = document.createElement("div");
    card.className = "card";

    const safeExt = (it.ext || "").toUpperCase();
    const safeName = escapeHtml(it.name || "sticker");
    const safeCat = escapeHtml(it.category || "");

    card.innerHTML = `
      <div class="preview">
        <img src="${it.dataUrl}" alt="${safeName}" loading="lazy" />
      </div>
      <div class="meta">
        <div class="nameRow">
          <div class="filename" title="${safeName}">${safeName}</div>
          <div style="display:flex; gap:6px;">
            <div class="badge">${safeExt}</div>
            <div class="badge category">${safeCat}</div>
          </div>
        </div>
        <div class="cardActions">
          <button class="btn secondary" data-action="download" data-id="${it.id}">
            ⬇️ Download
          </button>
          <button class="btn danger" data-action="remove" data-id="${it.id}">
            🗑️
          </button>
        </div>
      </div>
    `;

    card.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button");
      if (!btn) return;

      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      if (!id || !action) return;

      if (action === "download") downloadItem(id);
      if (action === "remove") removeItem(id);
    });

    grid.appendChild(card);
  }
}

/* ---------- Actions ---------- */
function removeItem(id) {
  const idx = items.findIndex(x => x.id === id);
  if (idx === -1) return;
  const name = items[idx].name;
  items.splice(idx, 1);
  saveItems(items);
  render();
  setStatus(`🗑️ "${name}" entfernt.`);
}

function downloadItem(id) {
  const it = items.find(x => x.id === id);
  if (!it) return;

  const a = document.createElement("a");
  a.href = it.dataUrl;
  a.download = it.name || `sticker.${it.ext || "png"}`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setStatus(`⬇️ Download gestartet: "${it.name}"`);
}

/* ---------- Storage ---------- */
function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(x => x && typeof x === "object" && x.dataUrl && x.name);
  } catch {
    return [];
  }
}

function saveItems(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error(e);
    setStatus("❌ Speicher voll. Zu viele/zu große Dateien für localStorage.");
  }
}

/* ---------- Cookies ---------- */
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + d.toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const target = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";").map(x => x.trim());
  for (const p of parts) {
    if (p.startsWith(target)) {
      return decodeURIComponent(p.substring(target.length));
    }
  }
  return "";
}

/* ---------- Utilities ---------- */
function setStatus(msg) {
  statusEl.textContent = msg;
}

/* Timing-safe-ish compare */
function timingSafeEqual(a, b) {
  const aa = String(a);
  const bb = String(b);
  if (aa.length !== bb.length) return false;
  let out = 0;
  for (let i = 0; i < aa.length; i++) out |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  return out === 0;
}

function setAppInteractive(enabled) {
  // overlays are separate; this just controls the app area.
  if (!appRoot) return;
  if (enabled) {
    appRoot.style.filter = "";
    appRoot.style.pointerEvents = "";
    appRoot.style.userSelect = "";
  } else {
    appRoot.style.filter = "blur(6px)";
    appRoot.style.pointerEvents = "none";
    appRoot.style.userSelect = "none";
  }
}

function getExt(filename) {
  const m = (filename || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function mimeFromExt(ext) {
  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    tif: "image/tiff",
    tiff: "image/tiff",
    heic: "image/heic"
  };
  return map[ext] || "application/octet-stream";
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}